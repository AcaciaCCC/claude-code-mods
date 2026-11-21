import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Day } from '../types'
import { pickLang, STRINGS } from './strings'
import type { Strings } from './strings'

// 介面文字：register 依設定的 language 換成對應語言。
let S: Strings = STRINGS['zh-Hant']

// ─── TCAN 配色：要調整顏色只改這裡 ─────────────────────────────────────
const PALETTE = {
  light: '#0DCAFE', // TCAN 青藍（淺藍）：一天 1 小時以內
  deep: '#1A67F8', // TCAN 藍（深藍）：一天 1–2 小時
  hot: '#FF5561', // TCAN 紅：一天 2 小時以上
  track: 'subtle', // 0：中性灰（跟隨 app 主題）
  muted: 'inactive', // 次要文字（跟隨 app 主題）
}
// ────────────────────────────────────────────────────────────────────

// 「其他」資料夾的灰（跟 usage-meter 月曆空格同一種半透明灰）。
const SVG_GREY = 'rgba(138,143,152,0.28)'

const PANE = 'usage-time'
const widget = () => ({ id: PANE, title: S.title, placement: 'widget' }) as const
// 兩個 mod 都裝時，由 usage-meter 把兩顆按鈕畫在同一行。
const LEADER_COMMAND = 'usage-meter'
// 兩則訊息之間隔超過這麼久，就當作你離開了，那段不算。
const GAP_MS = 30 * 60_000
// 所有對話共用的紀錄：每天記「時段」（幾點到幾點），算總和時先合併重疊，
// 兩個對話同時開著的時間只算一次。舊的 'days'、'days-v2' 只有分鐘數，不再用。
const STORE_KEY = 'stay-v3'
const KEEP_DAYS = 21

const startedAt = atom({ plugin: 'usage-time', key: 'startedAt' } as const, 0)
const workMs = atom({ plugin: 'usage-time', key: 'workMs' } as const, 0)
const days = atom({ plugin: 'usage-time', key: 'days' } as const, {} as Record<string, Day>)
const tick = atom({ plugin: 'usage-time', key: 'tick' } as const, 0)
// 單獨裝時，自己的小工具開著沒（按鈕顯示「◷ 收起」）。
const isOpen = atom({ plugin: 'usage-time', key: 'isOpen' } as const, false)
// 這次對話：從第一則訊息到最後一則訊息（中間隔超過 30 分鐘的不算）。usage-meter 也讀這個。
const sessionMs = atom({ plugin: 'usage-time', key: 'sessionMs' } as const, 0)
// 上一則訊息送出的時間（0 = 還沒送過）。
const lastSubmitAt = atom({ plugin: 'usage-time', key: 'lastSubmitAt' } as const, 0)

function dayKey(ms: number): string {
  const d = new Date(ms)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 這週一到週日的日期 key（週一開始）。 */
function weekKeys(now: number): string[] {
  const d = new Date(now)
  const sinceMonday = (d.getDay() + 6) % 7
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - sinceMonday)
  return Array.from({ length: 7 }, (_, i) =>
    dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i).getTime()),
  )
}

/** 時間一律寫成分鐘：「83m」。 */
function short(ms: number): string {
  return `${Math.max(0, Math.floor(ms / 60_000))}m`
}

/** 本週每天的顏色格：0 灰、1 小時內淺藍、1–2 小時深藍、2 小時以上紅。 */
function dayColor(ms: number): string {
  const h = ms / 3_600_000
  if (ms < 60_000) return PALETTE.track
  if (h < 1) return PALETTE.light
  if (h < 2) return PALETTE.deep
  return PALETTE.hot
}

/** 一段使用時間：開始、結束，和當時所在的資料夾（舊紀錄沒有資料夾）。 */
type Span = [number, number] | [number, number, string]

/** 一天的紀錄：用過的時段（同一個資料夾內已合併）和 Claude 工作的毫秒數。 */
type Stay = { spans: Span[]; work: number }

/** 把重疊或相接的時段合併成一段（不管資料夾）。 */
function mergeSpans(spans: readonly Span[]): Array<[number, number]> {
  const sorted = spans.map(([s, e]) => [s, e] as [number, number]).sort((a, b) => a[0] - b[0])
  const out: Array<[number, number]> = []
  for (const [s, e] of sorted) {
    const last = out[out.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out
}

/** 跨過半夜的時段切成兩天。 */
function splitByDay(start: number, end: number): Array<[string, number, number]> {
  const out: Array<[string, number, number]> = []
  let s = start
  while (s < end) {
    const d = new Date(s)
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime()
    const e = Math.min(end, midnight)
    out.push([dayKey(s), s, e])
    s = e
  }
  return out
}

const length = (spans: Array<[number, number]>) => spans.reduce((sum, [s, e]) => sum + (e - s), 0)

/** 同一個資料夾的時段各自合併；不同資料夾分開放（你同一時間只會在一個資料夾）。 */
function mergeByFolder(spans: readonly Span[]): Span[] {
  const groups = new Map<string, Span[]>()
  for (const sp of spans) {
    const f = sp[2] ?? ''
    groups.set(f, [...(groups.get(f) ?? []), sp])
  }
  const out: Span[] = []
  for (const [f, list] of groups) {
    for (const [s, e] of mergeSpans(list)) out.push(f ? [s, e, f] : [s, e])
  }
  return out.sort((a, b) => a[0] - b[0])
}

/** 每天的總和：合併後的時段長度相加；另外分資料夾加總。 */
function toDays(stay: Record<string, Stay>): Record<string, Day> {
  const out: Record<string, Day> = {}
  for (const [k, v] of Object.entries(stay)) {
    const spans = v.spans ?? []
    const folders: Record<string, number> = {}
    for (const sp of mergeByFolder(spans)) {
      const f = sp[2] ?? ''
      folders[f] = (folders[f] ?? 0) + (sp[1] - sp[0])
    }
    out[k] = { active: length(mergeSpans(spans)), work: v.work ?? 0, folders }
  }
  return out
}

/** 資料夾路徑的最後一層：「/Users/me/Projects/my-project」→「my-project」。 */
function folderName(cwd: string): string {
  const parts = cwd.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] ?? cwd
}

/** 本週各資料夾：時間、百分比、顏色（前三名用 TCAN 三色，其餘併成「其他」灰色）。 */
function folderShares(
  days: Record<string, { folders?: Record<string, number> }>,
  week: readonly string[],
  colors: readonly string[],
  rest: string,
): Array<{ name: string; ms: number; pct: number; color: string }> {
  const sum: Record<string, number> = {}
  for (const k of week) {
    for (const [f, ms] of Object.entries(days[k]?.folders ?? {})) sum[f] = (sum[f] ?? 0) + ms
  }
  const total = Object.values(sum).reduce((a, v) => a + v, 0)
  if (total <= 0) return []
  const sorted = Object.entries(sum)
    .filter(([, ms]) => ms > 0)
    .sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, colors.length)
  const others = sorted.slice(colors.length).reduce((a, [, ms]) => a + ms, 0)
  const rows = top.map(([f, ms], i) => ({
    name: f || S.unsorted,
    ms,
    pct: Math.round((ms / total) * 100),
    color: colors[i] ?? rest,
  }))
  if (others > 0) rows.push({ name: S.other, ms: others, pct: Math.round((others / total) * 100), color: rest })
  return rows
}

async function loadStay($: EngineInterface): Promise<Record<string, Stay>> {
  const stored = (await $.store.get(STORE_KEY)) as Record<string, Stay> | undefined
  return stored && typeof stored === 'object' ? stored : {}
}

async function loadDays($: EngineInterface): Promise<Record<string, Day>> {
  return toDays(await loadStay($))
}

async function saveStay($: EngineInterface, all: Record<string, Stay>): Promise<void> {
  // 只留最近幾週。
  const oldest = dayKey((await $.clock.now()) - KEEP_DAYS * 86_400_000)
  for (const k of Object.keys(all)) if (k < oldest) delete all[k]
  await $.store.set(STORE_KEY, all)
  await update($, days, () => toDays(all))
}

/** 記下一段使用時間（start 到 end，在哪個資料夾），跟所有對話的時段合併。 */
async function addSpan($: EngineInterface, start: number, end: number, folder: string): Promise<void> {
  const all = await loadStay($)
  for (const [k, s, e] of splitByDay(start, end)) {
    const day = all[k] ?? { spans: [], work: 0 }
    all[k] = { spans: mergeByFolder([...day.spans, [s, e, folder]]), work: day.work }
  }
  await saveStay($, all)
}

/** Claude 工作的時間（每個對話各自加，不合併）。 */
async function addWork($: EngineInterface, ms: number): Promise<void> {
  const now = await $.clock.now()
  const all = await loadStay($)
  const k = dayKey(now)
  const day = all[k] ?? { spans: [], work: 0 }
  all[k] = { spans: day.spans, work: day.work + ms }
  await saveStay($, all)
}

async function toggle($: EngineInterface): Promise<string> {
  const up = (await $.ui.panes()).some(p => p.id === PANE)
  if (up) {
    await $.ui.close({ id: PANE })
    await update($, isOpen, () => false)
    return S.closedMsg
  }
  const r = await $.ui.open(widget())
  await update($, isOpen, () => r.isPlaced)
  return r.isPlaced ? S.openedMsg : S.notOpened
}

export const register: Register = (on, options) => {
  S = STRINGS[pickLang(options?.language)]

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'usage-time', description: S.commandDescription })
    try {
      const u = await $.session.usage()
      await update($, startedAt, () => u.startedAt)
    } catch {
      const now = await $.clock.now()
      await update($, startedAt, () => now)
    }
    const stored = await loadDays($)
    await update($, days, () => stored)

    // 每分鐘刷新一次畫面，讓時間往前走。
    void (async () => {
      try {
        for (;;) {
          await $.clock.sleep(60_000)
          // 重新讀共用紀錄：別的對話累積的時間也算進「今天」。
          const fresh = await loadDays($)
          await update($, days, () => fresh)
          await update($, tick, n => n + 1)
        }
      } catch {
        // 模組重新載入或 session 結束時停下來。
      }
    })()
    return result
  })

  // 用小工具自己的 × 關掉時，按鈕變回時間。
  on('ui.close', async ($, e, next) => {
    const result = await next(e)
    if (e.id === PANE) await update($, isOpen, () => false)
    return result
  })

  on('command.run', { command: 'usage-time' }, async $ => {
    // usage-meter 也裝了的話，時間畫在它的小工具下半部，由它的「◷」按鈕開關
    // （它直接讀這裡的 workMs 和 days；指令裡不能再呼叫別的指令）。
    if ((await $.command.list()).some(c => c.name === LEADER_COMMAND)) {
      if ((await $.ui.panes()).some(p => p.id === PANE)) await $.ui.close({ id: PANE })
      return { text: S.inMeter }
    }
    return { text: await toggle($) }
  })

  // 你送出一則訊息：「上一則 → 這一則」算進使用時間；隔超過 30 分鐘的不算。
  // 所以一個對話算的是第一則訊息到最後一則訊息之間的時間。
  on('prompt.submit', async ($, e, next) => {
    if (!e.isMeta && e.origin.kind !== 'plugin') {
      const now = await $.clock.now()
      const last = await read($, lastSubmitAt)
      const gap = last > 0 ? now - last : 0
      if (gap > 0 && gap <= GAP_MS) {
        await update($, sessionMs, n => n + gap)
        await addSpan($, last, now, folderName(await $.session.cwd()))
      }
      await update($, lastSubmitAt, () => now)
    }
    return next(e)
  })

  // Claude 回完一輪（只算主對話，不算子代理）：只算進「Claude 工作」。
  on('turn.complete', async ($, e, next) => {
    if (!e.agentId && e.durationMs > 0) {
      await update($, workMs, n => n + e.durationMs)
      await addWork($, e.durationMs)
    }
    return next(e)
  })

  // 輸入框右上方的按鈕。usage-meter 也裝了的話，由它把兩顆按鈕畫在同一行。
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const commands = await $.command.list()
    if (commands.some(c => c.name === LEADER_COMMAND)) return next(e)

    await read($, tick)
    const { Box, Button } = $.ui.resolve(e)
    const spent = await read($, sessionMs)
    const open = await read($, isOpen)

    return (
      <Box justifyContent="flex-end" width="100%">
        <Button
          key="toggle"
          label={open ? `◷ ${S.close}` : `◷ ${short(spent)}`}
          variant="secondary"
          onPress={() => void toggle($)}
        />
      </Box>
    )
  })

  // 小工具本體。
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await read($, tick)
    const { Box, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    const all = await read($, days)

    const todayKey = dayKey(now)
    const week = weekKeys(now)
    const today = all[todayKey]?.active ?? 0
    const weekTotal = week.reduce((sum, k) => sum + (all[k]?.active ?? 0), 0)
    const shares = folderShares(all, week, [PALETTE.deep, PALETTE.light, PALETTE.hot], SVG_GREY)

    return (
      <Box flexDirection="column" padding={1} gap={1}>
        {/* 今天在所有對話花的時間（最大字）。 */}
        <Box flexDirection="column">
          <Box justifyContent="space-between" alignItems="flex-end">
            <Text color={PALETTE.muted}>{S.todayAll}</Text>
            <Text bold>{short(today)}</Text>
          </Box>
        </Box>

        {/* 本週每天：星期一到日由左到右，上面星期、中間顏色格、下面分鐘。 */}
        <Box gap={1}>
          {week.map(k => {
            const ms = all[k]?.active ?? 0
            const isToday = k === todayKey
            const isFuture = k > todayKey
            const [y, mo, d] = k.split('-').map(Number)
            const weekday = S.weekdays[new Date(y ?? 0, (mo ?? 1) - 1, d ?? 1).getDay()]
            return (
              <Box key={k} flexDirection="column" flexGrow={1} alignItems="center">
                <Text bold={isToday} color={isToday ? undefined : PALETTE.muted}>
                  {weekday}
                </Text>
                <Box
                  width="100%"
                  height={1}
                  backgroundColor={isFuture ? undefined : dayColor(ms)}
                />
                <Text bold={isToday} color={isToday ? undefined : PALETTE.muted}>
                  {isFuture ? ' ' : short(ms)}
                </Text>
              </Box>
            )
          })}
        </Box>

        <Box key="folders" flexDirection="column" gap="xs">
          <Box justifyContent="space-between">
            <Text color={PALETTE.muted}>{S.weekFolders}</Text>
            <Text>{short(weekTotal)}</Text>
          </Box>
          {shares.length > 0 && (
          <Box height={1}>
            {shares.map(r => (
              <Box key={`f-${r.name}`} flexGrow={Math.max(1, r.pct)} height={1} backgroundColor={r.color} />
            ))}
          </Box>
          )}
          {shares.map(r => (
            <Box key={`l-${r.name}`} justifyContent="space-between">
              <Text>
                <Text color={r.color}>■ </Text>
                <Text>{r.name}</Text>
              </Text>
              <Text color={PALETTE.muted}>
                {r.pct}% · {short(r.ms)}
              </Text>
            </Box>
          ))}
        </Box>

        <Text color={PALETTE.muted}>{S.note}</Text>
      </Box>
    )
  })
}
