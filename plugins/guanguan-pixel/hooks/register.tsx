import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Scene } from '../types'
import { EARTH_FAST, IDLE, TCAN_ICON, WALK, WINK } from './sprite'

// 輸入框上方的場景：平常什麼都不顯示，只在特定時刻出現幾秒。
const scene = atom({ plugin: 'guanguan-pixel', key: 'scene' } as const, null as Scene)
const HELLO_MS = 6000
const DONE_MS = 4000
const HELLO_KEY = 'lastHelloDate'
const TCAN_MS = 8000
const EARTH_MS = 8000
const LONG_MS = 60000

// 訊息裡出現這些詞（不分大小寫）就跳出 TCAN 圖示。
const TCAN_WORDS = ['tcan']

let longTimer: Timer | undefined
// TCAN 圖示要演到這個時間點（毫秒），期間「搞定」先排隊。
let tcanUntil = 0
let doneTimer: Timer | undefined

// 正在用的工具：讓「運作中」那一排依工具換台詞。
const currentTool = atom({ plugin: 'guanguan-pixel', key: 'tool' } as const, null as string | null)

const TOOL_WORDS: Record<string, string> = {
  Bash: '罐罐跑指令中',
  Read: '罐罐翻資料中',
  Grep: '罐罐找線索中',
  Glob: '罐罐找檔案中',
  Edit: '罐罐修改中',
  Write: '罐罐寫東西中',
  NotebookEdit: '罐罐寫東西中',
  WebSearch: '罐罐上網查資料',
  WebFetch: '罐罐上網看網頁',
  Agent: '罐罐找幫手中',
  Skill: '罐罐翻說明書',
}

const WORDS: Record<string, string> = {
  thinking: '罐罐思考中',
  requesting: '罐罐出發中',
  'tool-use': '罐罐動手做',
  'tool-input': '罐罐動手做',
  responding: '罐罐回覆中',
}

// 從工具的輸入挑一句人看得懂的描述（指令說明、檔名、搜尋字…）。
function describe(input: unknown): string | undefined {
  if (typeof input !== 'object' || input === null) {
    return undefined
  }
  const fields = input as Record<string, unknown>
  for (const key of ['description', 'file_path', 'pattern', 'query', 'url', 'command']) {
    const value = fields[key]
    if (typeof value === 'string' && value.trim() !== '') {
      const text = key === 'file_path' ? (value.split('/').pop() ?? value) : value

      return text.length > 80 ? `${text.slice(0, 79)}…` : text
    }
  }

  return undefined
}

let sceneTimer: Timer | undefined

// 演一個場景，ms 毫秒後收起來。
function play($: EngineInterface, next: Scene, ms: number) {
  sceneTimer?.cancel()
  update($, scene, () => next).catch(() => {})
  sceneTimer = $.clock.after(ms, () => {
    update($, scene, () => null).catch(() => {})
  })
}

// 台灣日期（UTC+8），例如 2026-11-17。
async function today($: EngineInterface) {
  const now = await $.clock.now()

  return new Date(now + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

// 每天第一則訊息時打招呼。
async function greetOncePerDay($: EngineInterface) {
  const date = await today($)
  if ((await $.store.get(HELLO_KEY)) === date) {
    return
  }
  await $.store.set(HELLO_KEY, date)
  play($, 'hello', HELLO_MS)
}

// 工作超過一分鐘：地球出來轉一下，之後每分鐘再轉一次。
function watchLongRun($: EngineInterface) {
  longTimer?.cancel()
  longTimer = $.clock.after(LONG_MS, () => {
    play($, 'earth', EARTH_MS)
    watchLongRun($)
  })
}

export const register: Register = on => {
  on('prompt.submit', ($, e, next) => {
    const lower = e.text.toLowerCase()
    doneTimer?.cancel()
    if (TCAN_WORDS.some(word => lower.includes(word))) {
      play($, 'tcan', TCAN_MS)
      $.clock.now().then(now => { tcanUntil = now + TCAN_MS }).catch(() => {})
    } else {
      greetOncePerDay($).catch(() => {})
    }
    watchLongRun($)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    longTimer?.cancel()
    const wait = tcanUntil - (await $.clock.now())
    if (wait > 0) {
      doneTimer = $.clock.after(wait, () => play($, 'done', DONE_MS))
    } else {
      play($, 'done', DONE_MS)
    }

    return result
  })

  on('tool.call', async ($, e, next) => {
    update($, currentTool, () => e.tool).catch(() => {})
    try {
      return await next(e)
    } finally {
      update($, currentTool, () => null).catch(() => {})
    }
  })

  // Claude 工作時的「運作中」那一排：換成踏步的像素罐罐。
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.surface !== 'desktop') {
      return next(e)
    }

    const { Box, Svg, Text } = $.ui.resolve(e)
    const tool = await read($, currentTool)
    const toolWord =
      e.props.mode === 'tool-use' && tool
        ? (TOOL_WORDS[tool] ?? (tool.startsWith('mcp__') ? '罐罐連線外部工具中' : undefined))
        : undefined
    const label = e.props.message ?? toolWord ?? WORDS[e.props.mode] ?? e.props.word

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg source={WALK} alt="像素罐罐在踏步" width={30} height={33} isInteractive />
        <Text dimColor>{label}…</Text>
      </Box>
    )
  })

  // 對話裡正在執行的工具列：把 app 的轉圈點點換成踏步的小罐罐，做完就恢復原樣。
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || !e.props.isRunning) {
      return next(e)
    }

    const { Box, Svg, Text } = $.ui.resolve(e)
    const what = describe(e.props.input)
    const word = TOOL_WORDS[e.props.tool] ?? (e.props.tool.startsWith('mcp__') ? '罐罐連線外部工具中' : '罐罐動手做')

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg source={WALK} alt="像素罐罐在工作" width={18} height={20} isInteractive />
        <Text>{what ?? word}</Text>
        {what ? <Text dimColor>{word}…</Text> : null}
      </Box>
    )
  })

  // 收合成一行的一串工具（讀了 3 個檔案…）：還在進行時也放小罐罐。
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || !e.props.isActive) {
      return next(e)
    }

    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg source={WALK} alt="像素罐罐在工作" width={18} height={20} isInteractive />
        <Box flexGrow={1}>{await next(e)}</Box>
      </Box>
    )
  })

  // 輸入框上方：只在每日招呼和做完事時出現，置中顯示罐罐和對話泡泡。
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.hasSurvey) {
      return next(e)
    }

    const now = await read($, scene)
    const done = now === 'done' && !e.props.isWorking
    if (now === null || (now === 'done' && !done) || (now === 'earth' && !e.props.isWorking)) {
      return next(e)
    }

    const { Box, Svg, Text } = $.ui.resolve(e)
    const art =
      now === 'tcan' ? (
        <Svg source={TCAN_ICON} alt="TCAN 像素圖示" width={37} height={44} isInteractive />
      ) : now === 'earth' ? (
        <Svg source={EARTH_FAST} alt="旋轉的像素地球" width={30} height={30} isInteractive />
      ) : (
        <Svg source={done ? WINK : IDLE} alt={done ? '像素罐罐眨眼' : '像素罐罐'} width={30} height={33} isInteractive />
      )
    const text =
      now === 'tcan'
        ? 'TCAN 台灣氣候行動網絡'
        : now === 'earth'
          ? '跑好久了，地球轉一下～'
          : done
            ? '搞定！✨'
            : '罐罐說你好！一起為氣候採取行動 🌍'

    return (
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap={1} width="100%">
        {art}
        {now === 'tcan' ? null : (
          <Box borderStyle="round" borderDimColor paddingX={1}>
            <Text bold={done}>{text}</Text>
          </Box>
        )}
      </Box>
    )
  })
}
