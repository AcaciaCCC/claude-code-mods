import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Day, Limit } from '../types'

// ─── TCAN 配色：要調整顏色只改這裡 ─────────────────────────────────────
// TCAN logo 三色：青藍 #0DCAFE、藍 #1A67F8、紅 #FF5561
const PALETTE = {
  primary: '#1A67F8', // TCAN 藍：額度充足（剩 30% 以上）的進度條
  accent: '#FF5561AA', // TCAN 紅（淡）：剩 30% 以下
  danger: '#FF5561', // TCAN 紅：剩 10% 以下
  track: 'subtle', // 進度條還沒用到的格子：中性灰（跟隨 app 主題），不跟增溫條的藍色混淆
  teal: '#0DCAFE', // TCAN 青藍：重置時間
  muted: 'inactive', // 次要文字（跟隨 app 主題）
}

// 增溫條（warming stripes）色階：由冷（深藍）到熱（深紅）。
// 進度條代表「已用」：用得越多，條紋越往紅色延伸。
const STRIPES = [
  '#08306B', '#08519C', '#2171B5', '#4292C6', '#6BAED6', '#9ECAE1', '#C6DBEF', '#DEEBF7',
  '#FEE0D2', '#FCBBA1', '#FC9272', '#FB6A4A', '#EF3B2C', '#CB181D', '#A50F15', '#67000D',
]
const SEGMENTS = 20 // 進度條切成幾格
// ────────────────────────────────────────────────────────────────────

function stripeAt(i: number): string {
  const idx = Math.min(STRIPES.length - 1, Math.floor((i / SEGMENTS) * STRIPES.length))
  return STRIPES[idx] ?? '#67000D'
}

const PANE = 'usage-meter'
const TITLE = '用量'
const limits = atom({ plugin: 'usage-meter', key: 'limits' } as const, [] as Limit[])
// 兩顆按鈕各自的開關：用量那一段、使用時間那一段。
const showUsage = atom({ plugin: 'usage-meter', key: 'showUsage' } as const, false)
const showTime = atom({ plugin: 'usage-meter', key: 'showTime' } as const, false)
const sessionStart = atom({ plugin: 'usage-meter', key: 'sessionStart' } as const, 0)
const tick = atom({ plugin: 'usage-meter', key: 'tick' } as const, 0)
// 每天用掉多少 7 天額度（%），給月曆小方格用。所有對話共用，存在 $.store。
const dailyWeekUse = atom({ plugin: 'usage-meter', key: 'dailyWeekUse' } as const, {} as Record<string, number>)

// usage-time 的狀態：只讀不寫（它沒裝就讀到預設值）。
const timeDays = atom({ plugin: 'usage-time', key: 'days' } as const, {} as Record<string, Day>)
// 這次對話：第一則訊息到最後一則訊息（隔超過 30 分鐘不算），由 usage-time 計算。
const timeSession = atom({ plugin: 'usage-time', key: 'sessionMs' } as const, 0)

// 另一個 mod「usage-time」的指令。兩個都裝時，兩顆按鈕由這裡畫在同一行。
const TIME_COMMAND = 'usage-time'

/** 時間一律寫成分鐘：「83m」。 */
function shortTime(ms: number): string {
  return `${Math.max(0, Math.floor(ms / 60_000))}m`
}

/** 本週每天的顏色格：0 灰、1 小時內淺藍、1–2 小時深藍、2 小時以上紅（TCAN 配色）。 */
function dayColor(ms: number, track: string = PALETTE.track): string {
  const h = ms / 3_600_000
  if (ms < 60_000) return track
  if (h < 1) return PALETTE.teal
  if (h < 2) return PALETTE.primary
  return PALETTE.danger
}

const NAMES: Record<string, string> = { five_hour: '5 小時', seven_day: '7 天' }
const ORDER = ['five_hour', 'seven_day']

function pick(rs: SessionRateLimit[]): Limit[] {
  return rs
    .filter(r => r.kind in NAMES)
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt }))
}

function leftOf(l: Limit): number {
  return Math.max(0, Math.min(100, Math.round(100 - l.percentUsed)))
}

function colorOf(left: number): string {
  if (left <= 10) return PALETTE.danger
  if (left <= 30) return PALETTE.accent
  return PALETTE.primary
}

// 三格電量條：依兩個額度中剩比較少的那個。
function battery(ls: Limit[]): string {
  if (ls.length === 0) return '▯▯▯'
  const left = Math.min(...ls.map(leftOf))
  const cells = left <= 10 ? 0 : left <= 40 ? 1 : left <= 70 ? 2 : 3
  return '▮'.repeat(cells) + '▯'.repeat(3 - cells)
}

/** 收起時按鈕上的字：5 小時已用 %（還沒有資料就寫「用量」）。 */
function usedLabel(ls: Limit[]): string {
  const five = ls.find(l => l.kind === 'five_hour')
  return five ? `${Math.round(five.percentUsed)}%` : '用量'
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function when(iso: string | undefined, now: number): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (x: number) => String(x).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const isToday = d.toDateString() === new Date(now).toDateString()
  const isTomorrow = d.toDateString() === new Date(now + 86_400_000).toDateString()
  const day = isToday ? '今天' : isTomorrow ? '明天' : `${d.getMonth() + 1}/${d.getDate()} 週${WEEK[d.getDay()]}`
  return `↻ ${day} ${time}`
}


const WIDGET = { id: PANE, placement: 'widget' } as const

// ─── 使用時間（usage-time 也裝了才會有）─────────────────────────────────

function dayKey(ms: number): string {
  const d = new Date(ms)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 這週一到週日的日期 key（週一開始）。 */
function weekKeys(now: number): string[] {
  const d = new Date(now)
  const sinceMonday = (d.getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) =>
    dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - sinceMonday + i).getTime()),
  )
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
    name: f || '未分類（記資料夾之前）',
    ms,
    pct: Math.round((ms / total) * 100),
    color: colors[i] ?? rest,
  }))
  if (others > 0) rows.push({ name: '其他', ms: others, pct: Math.round((others / total) * 100), color: rest })
  return rows
}

async function hasTimeMod($: EngineInterface): Promise<boolean> {
  return (await $.command.list()).some(c => c.name === TIME_COMMAND)
}

/** 依兩個開關打開、改標題或關掉小工具。 */
async function syncPane($: EngineInterface): Promise<void> {
  const u = await read($, showUsage)
  const t = (await read($, showTime)) && (await hasTimeMod($))
  if (!u && !t) {
    await $.ui.close({ id: PANE })
    return
  }
  const title = u && t ? '用量與時間' : u ? TITLE : '使用時間'
  await $.ui.open({ ...WIDGET, title })
}

async function toggleUsage($: EngineInterface): Promise<void> {
  await update($, showUsage, v => !v)
  await syncPane($)
}

async function toggleTime($: EngineInterface): Promise<void> {
  await update($, showTime, v => !v)
  await syncPane($)
}

// ─── 月曆小方格：每天用掉多少 7 天額度 ───────────────────────────────

const WEEK_USE_KEY = 'week-use-v1'
const KEEP_USE_DAYS = 120

/** 存在 $.store：上一次看到的 7 天已用 %，和每天累計用掉的 %。 */
type WeekUse = { last?: number; days: Record<string, number> }

async function loadWeekUse($: EngineInterface): Promise<WeekUse> {
  const v = (await $.store.get(WEEK_USE_KEY)) as WeekUse | undefined
  return v && typeof v === 'object' && v.days ? v : { days: {} }
}

/**
 * 收到新的 7 天已用 %：比上一次多出來的部分算進今天。
 * 變少（舊的用量滾出 7 天視窗、或額度重置）不算，只更新基準。
 * 上一次的數字存在 $.store，所有對話共用，同一段增加不會被重複算。
 */
async function recordWeekUse($: EngineInterface, rs: readonly SessionRateLimit[]): Promise<void> {
  const seven = rs.find(r => r.kind === 'seven_day')
  if (!seven) return
  const now = await $.clock.now()
  const data = await loadWeekUse($)
  const delta = data.last === undefined ? 0 : seven.percentUsed - data.last
  if (delta > 0) {
    const k = dayKey(now)
    data.days[k] = Math.round(((data.days[k] ?? 0) + delta) * 10) / 10
  }
  data.last = seven.percentUsed
  const oldest = dayKey(now - KEEP_USE_DAYS * 86_400_000)
  for (const k of Object.keys(data.days)) if (k < oldest) delete data.days[k]
  await $.store.set(WEEK_USE_KEY, data)
  const days = data.days
  await update($, dailyWeekUse, () => days)
}

/** 月曆格子的顏色：0 灰、10% 以內淺藍、10–20% 深藍、超過 20% 紅（TCAN 配色）。 */
function useColor(pct: number): string {
  if (pct <= 0) return PALETTE.track
  if (pct <= 10) return PALETTE.teal
  if (pct <= 20) return PALETTE.primary
  return PALETTE.danger
}

// SVG 裡用不了 app 的主題色，所以灰色用半透明，深色、淺色模式都看得清楚。
const SVG_EMPTY = 'rgba(138,143,152,0.28)'
const SVG_LABEL = 'rgba(138,143,152,0.95)'
const CELL = 16 // 方格邊長（px）
const GAP = 4 // 方格間距（px）
const RADIUS = 3.5 // 圓角（px）
const LABEL_H = 18 // 月份那一列的高度（px）

/** 畫成一張 SVG：正方形、圓角，每一欄一週，由上到下週一到週日；滑過格子顯示日期和 %。 */
function calendarSvg(
  weeks: number,
  dateAt: (col: number, row: number) => Date,
  todayKey: string,
  use: Record<string, number>,
): string {
  const step = CELL + GAP
  const width = weeks * step - GAP
  const height = LABEL_H + 7 * step - GAP
  const out: string[] = []
  for (let col = 0; col < weeks; col++) {
    const monday = dateAt(col, 0)
    const prev = col > 0 ? dateAt(col - 1, 0) : null
    if (col === 0 || (prev && prev.getMonth() !== monday.getMonth())) {
      out.push(
        `<text x="${col * step}" y="13" font-size="12" font-family="system-ui, sans-serif" fill="${SVG_LABEL}">${monday.getMonth() + 1}月</text>`,
      )
    }
    for (let row = 0; row < 7; row++) {
      const d = dateAt(col, row)
      const k = dayKey(d.getTime())
      if (k > todayKey) continue
      const pct = use[k] ?? 0
      const fill = pct > 0 ? useColor(pct) : SVG_EMPTY
      const label = `${d.getMonth() + 1}/${d.getDate()}：${pct > 0 ? `用掉 ${pct}%` : '沒有用量'}`
      out.push(
        `<rect x="${col * step}" y="${LABEL_H + row * step}" width="${CELL}" height="${CELL}" rx="${RADIUS}" fill="${fill}"><title>${label}</title></rect>`,
      )
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${out.join('')}</svg>`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'usage-meter', description: '打開或收起 5 小時／7 天額度' })
    try {
      const u = await $.session.usage()
      await update($, limits, () => pick(u.rateLimits))
      await recordWeekUse($, u.rateLimits)
      await update($, sessionStart, () => u.startedAt)
    } catch {
      const now = await $.clock.now()
      await update($, sessionStart, () => now)
    }
    const stored = (await loadWeekUse($)).days
    await update($, dailyWeekUse, () => stored)

    // 小工具還開著（例如重新載入後）就當成用量那段開著，免得按鈕跟畫面對不上。
    const up = (await $.ui.panes()).some(p => p.id === PANE)
    if (up && !(await read($, showUsage)) && !(await read($, showTime))) {
      await update($, showUsage, () => true)
    }

    // 每分鐘刷新一次，讓時間往前走。
    void (async () => {
      try {
        for (;;) {
          await $.clock.sleep(60_000)
          // 重新讀共用紀錄：別的對話記到的用量也會出現在月曆上。
          const { days } = await loadWeekUse($)
          await update($, dailyWeekUse, () => days)
          await update($, tick, n => n + 1)
        }
      } catch {
        // 模組重新載入或 session 結束時停下來。
      }
    })()
    return result
  })

  on('command.run', { command: 'usage-meter' }, async $ => {
    await toggleUsage($)
    return { text: (await read($, showUsage)) ? '已打開額度。' : '已收起額度。' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => pick(e.rateLimits))
    if (e.changed.includes('rateLimits')) await recordWeekUse($, e.rateLimits)
    return next(e)
  })

  // 用小工具自己的 × 關掉時，兩顆按鈕都變回來。
  on('ui.close', async ($, e, next) => {
    const result = await next(e)
    if (e.id === PANE) {
      await update($, showUsage, () => false)
      await update($, showTime, () => false)
    }
    return result
  })

  // 輸入框右上方的按鈕：各自開關，打開後變「收起」。
  // usage-time 也裝了的話，它的按鈕由這裡並排畫（它自己就不畫了）。
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const { Box, Button } = $.ui.resolve(e)
    await read($, tick)
    const u = await read($, showUsage)
    const t = await read($, showTime)
    const ls = await read($, limits)
    const hasTime = await hasTimeMod($)
    const spent = await read($, timeSession)

    return (
      <Box justifyContent="flex-end" width="100%" gap={1}>
        {hasTime && (
          <Button
            key="time"
            label={t ? '◷ 收起' : `◷ ${shortTime(spent)}`}
            variant="secondary"
            onPress={() => void toggleTime($)}
          />
        )}
        <Button
          key="toggle"
          label={`${battery(ls)} ${u ? '收起' : usedLabel(ls)}`}
          variant="secondary"
          onPress={() => void toggleUsage($)}
        />
      </Box>
    )
  })

  // 小工具本體：開著的段落由上而下排，用量在上、使用時間在下。
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await read($, tick)
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    // 桌面版、手機、VS Code 畫得出 Svg；終端機畫不出來，就用方塊排。
    const Svg = e.surface !== 'terminal' && 'Svg' in els ? els.Svg : undefined
    const u = await read($, showUsage)
    const t = (await read($, showTime)) && (await hasTimeMod($))
    const now = await $.clock.now()

    // 灰色：跟月曆方格同一種半透明灰（終端機畫不了半透明，用主題灰）。
    const track = e.surface === 'terminal' ? PALETTE.track : SVG_EMPTY
    // 5 小時、7 天、每天用掉的 7 天額度：同一種字。
    const label = (text: string) => <Text color={PALETTE.muted}>{text}</Text>

    const heading = (text: string) => (
      <Text bold color={PALETTE.muted}>
        {text}
      </Text>
    )
    const both = u && t
    const parts = []

    if (u || !t) {
      const ls = await read($, limits)
      if (both) parts.push(<Box key="h-usage">{heading('額度')}</Box>)
      if (ls.length === 0) {
        parts.push(
          <Text key="no-limits" color={PALETTE.muted}>
            下一次回覆後顯示額度
          </Text>,
        )
      }
      for (const l of ls) {
        const left = leftOf(l)
        const color = colorOf(left)
        parts.push(
          <Box key={l.kind} flexDirection="column">
            <Box justifyContent="space-between" alignItems="flex-end">
              {label(NAMES[l.kind] ?? l.kind)}
              <Text>
                <Text bold color={color}>{left}</Text>
                <Text color={PALETTE.muted}>% 剩餘</Text>
              </Text>
            </Box>
            <Box height={1} marginTop={1}>
              {Array.from({ length: SEGMENTS }, (_, i) => {
                const isUsed = i < Math.round(((100 - left) / 100) * SEGMENTS)
                return (
                  <Box
                    key={`s${i}`}
                    flexGrow={1}
                    height={1}
                    backgroundColor={isUsed ? stripeAt(i) : track}
                  />
                )
              })}
            </Box>
            <Text color={PALETTE.muted}>已用 {100 - left}%</Text>
            <Text color={PALETTE.teal}>{when(l.resetsAt, now)}</Text>
          </Box>,
        )
      }

      // 月曆：每一欄是一週，由上到下是週一到週日；最右邊是這週。
      const use = await read($, dailyWeekUse)
      const weeks = Math.max(4, Math.min(16, Math.floor((e.props.bodyColumns - 2) / 3)))
      const today = new Date(now)
      const sinceMonday = (today.getDay() + 6) % 7
      const firstMonday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - sinceMonday - (weeks - 1) * 7,
      )
      const dateAt = (col: number, row: number) =>
        new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate() + col * 7 + row)
      const todayKey = dayKey(now)
      if (Svg) {
        parts.push(
          <Box key="calendar" flexDirection="column" alignItems="flex-start" marginTop={1} gap="xs">
            {label('每天用掉的 7 天額度')}
            {/* 靠左：外面包一層靠左的列，並給 SVG 固定的寬高，不讓它撐滿置中。 */}
            <Box justifyContent="flex-start" width="100%">
              <Svg
                source={calendarSvg(weeks, dateAt, todayKey, use)}
                alt={`最近 ${weeks} 週每天用掉的 7 天額度`}
                width={weeks * (CELL + GAP) - GAP}
                height={LABEL_H + 7 * (CELL + GAP) - GAP}
                isInteractive
              />
            </Box>
          </Box>,
        )
      } else parts.push(
        <Box key="calendar" flexDirection="column" marginTop={1}>
          {label('每天用掉的 7 天額度')}
          {/* 格子之間留小空白（xs：桌面版是細縫，終端機是一格）。 */}
          <Box gap="xs">
            {Array.from({ length: weeks }, (_, col) => {
              const monday = dateAt(col, 0)
              const prev = col > 0 ? dateAt(col - 1, 0) : null
              const isNewMonth = col === 0 || (prev !== null && prev.getMonth() !== monday.getMonth())
              return (
                <Box key={`m${col}`} width={2}>
                  <Text color={PALETTE.muted} wrap="truncate-end">
                    {isNewMonth ? String(monday.getMonth() + 1) : ''}
                  </Text>
                </Box>
              )
            })}
          </Box>
          <Box flexDirection="column" gap="xs">
          {Array.from({ length: 7 }, (_, row) => (
            <Box key={`r${row}`} gap="xs">
              {Array.from({ length: weeks }, (_, col) => {
                const k = dayKey(dateAt(col, row).getTime())
                const isFuture = k > todayKey
                return (
                  <Box
                    key={`c${col}`}
                    width={2}
                    height={1}
                    backgroundColor={isFuture ? undefined : useColor(use[k] ?? 0)}
                  />
                )
              })}
            </Box>
          ))}
          </Box>
        </Box>,
      )
    }

    if (t) {
      const days = await read($, timeDays)
      const todayKey = dayKey(now)
      const week = weekKeys(now)
      const today = days[todayKey]?.active ?? 0
      const weekTotal = week.reduce((sum, k) => sum + (days[k]?.active ?? 0), 0)
      const shares = folderShares(days, week, [PALETTE.primary, PALETTE.teal, PALETTE.danger], SVG_EMPTY)

      // 額度和使用時間中間多空一行。
      if (both) parts.push(<Box key="h-time" marginTop={2}>{heading('使用時間')}</Box>)

      // 1. 今天在所有對話花的時間（最大字）。
      parts.push(
        <Box key="today" flexDirection="column">
          <Box justifyContent="space-between" alignItems="flex-end">
            <Text color={PALETTE.muted}>今天（所有對話）</Text>
            <Text bold>{shortTime(today)}</Text>
          </Box>
        </Box>,
      )

      // 2–4. 本週每天：星期一到日由左到右，上面星期、中間顏色格、下面分鐘。
      parts.push(
        <Box key="week" gap={1}>
          {week.map(k => {
            const ms = days[k]?.active ?? 0
            const isToday = k === todayKey
            const isFuture = k > todayKey
            const [y, mo, d] = k.split('-').map(Number)
            const weekday = WEEK[new Date(y ?? 0, (mo ?? 1) - 1, d ?? 1).getDay()]
            return (
              <Box key={k} flexDirection="column" flexGrow={1} alignItems="center">
                <Text bold={isToday} color={isToday ? undefined : PALETTE.muted}>
                  {weekday}
                </Text>
                <Box
                  width="100%"
                  height={1}
                  backgroundColor={isFuture ? undefined : dayColor(ms, track)}
                />
                <Text bold={isToday} color={isToday ? undefined : PALETTE.muted}>
                  {isFuture ? ' ' : shortTime(ms)}
                </Text>
              </Box>
            )
          })}
        </Box>,
      )
      {
        parts.push(
        <Box key="folders" flexDirection="column" gap="xs">
          <Box justifyContent="space-between">
            <Text color={PALETTE.muted}>本週各資料夾</Text>
            <Text>{shortTime(weekTotal)}</Text>
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
                {r.pct}% · {shortTime(r.ms)}
              </Text>
            </Box>
          ))}
        </Box>,
        )
      }
      parts.push(
        <Text key="note" color={PALETTE.muted}>
          從第一則到最後一則訊息；隔超過 30 分鐘不算
        </Text>,
      )
    }

    return (
      <Box flexDirection="column" padding={1} gap={1}>
        {parts}
      </Box>
    )
  })
}
