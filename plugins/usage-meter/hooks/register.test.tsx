import { expect, test } from 'claude-code/testing'

// 既有的測試都用繁中介面；英文另外測。
const ZH = { options: { language: 'zh-Hant' } } as const
const EN = { options: { language: 'en' } } as const

const BAND = {
  plugin: 'usage-meter',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const PANE = {
  plugin: 'usage-meter',
  component: 'Pane',
  requestId: 'usage-meter',
  surface: 'desktop',
  props: {
    title: '用量與時間',
    isFocused: false,
    bodyColumns: 36,
    placement: 'widget',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const command = (name: string) => ({ name, description: '', source: 'plugin' as const, plugin: name })
const NOW = new Date(2026, 10, 17, 15, 0).getTime() // 週二
const BOTH = [command('usage-meter'), command('usage-time')]

/** 假的狀態：usage-meter 自己的開關與額度，加上 usage-time 的時間數字。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a test double for every key at once
function seed(values: Record<string, unknown>): any {
  return (_: unknown, e: { plugin: string; key: string }, next: (e: unknown) => unknown) => {
    const k = `${e.plugin}.${e.key}`
    return k in values ? { value: { value: values[k], version: 1 } } : next(e)
  }
}

test('alone, it draws only the usage button', ZH, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: 0 }))

  const ui = await $.ui.mount(BAND)
  const buttons = await ui.findAll({ type: 'Button' })
  expect(buttons.map(b => b.key)).toEqual(['toggle'])
  expect(buttons[0]?.props.label).toBe('▯▯▯ 用量') // 還沒有額度資料
  await ui.unmount()
})

test('closed, the usage button shows how much of the 5-hour window is used', ZH, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: 0 }))
  on(
    'state.get',
    seed({
      'usage-meter.limits': [
        { kind: 'five_hour', percentUsed: 28 },
        { kind: 'seven_day', percentUsed: 12 },
      ],
    }),
  )

  const ui = await $.ui.mount(BAND)
  expect((await ui.find({ type: 'Button', key: 'toggle' }))?.props.label).toBe('▮▮▮ 28%')
  await ui.unmount()
})

test('both installed: each button opens its own part and then reads 收起', ZH, async ($, on) => {
  const titles: string[] = []
  on('command.list', () => ({ value: BOTH }))
  on('clock.now', () => ({ value: 0 }))
  on('state.get', seed({ 'usage-time.sessionMs': 83 * 60_000 }))
  on('ui.open', (_, e) => {
    titles.push(String(e.title))
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }))

  const ui = await $.ui.mount(BAND)
  let buttons = await ui.findAll({ type: 'Button' })
  expect(buttons.map(b => [b.key, b.props.label])).toEqual([
    ['time', '◷ 83m'],
    ['toggle', '▯▯▯ 用量'],
  ])

  await ui.press({ key: 'time' }) // 只開時間
  await ui.press({ key: 'toggle' }) // 再開用量：同一個小工具上下兩段
  expect(titles).toEqual(['使用時間', '用量與時間'])

  buttons = await ui.findAll({ type: 'Button' })
  expect(buttons.map(b => b.props.label)).toEqual(['◷ 收起', '▯▯▯ 收起'])

  await ui.press({ key: 'time' }) // 收起時間：只剩用量
  expect(titles.at(-1)).toBe('用量')
  await ui.unmount()
})

test('both open: quotas on top, time below, read from usage-time', ZH, async ($, on) => {
  on('command.list', () => ({ value: BOTH }))
  on('clock.now', () => ({ value: NOW }))
  on(
    'state.get',
    seed({
      'usage-meter.showUsage': true,
      'usage-meter.showTime': true,
      'usage-time.sessionMs': 83 * 60_000,
      'usage-meter.limits': [{ kind: 'five_hour', percentUsed: 28 }],
      'usage-time.workMs': 18 * 60_000,
      'usage-time.days': { '2026-11-17': { active: 125 * 60_000, work: 18 * 60_000 } },
    }),
  )

  const ui = await $.ui.mount(PANE)
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  const at = (s: string) => texts.findIndex(t => t.includes(s))

  expect(at('額度')).toBeGreaterThan(-1)
  expect(at('72% 剩餘')).toBeGreaterThan(at('額度'))
  expect(at('使用時間')).toBeGreaterThan(at('72% 剩餘'))
  expect(texts.some(t => t.includes('這次對話'))).toBe(false) // 這行拿掉了
  expect(texts.some(t => t.includes('灰 0'))).toBe(false) // 顏色說明也拿掉了
  expect(texts).toContain('125m') // 今天（所有對話）
  await ui.unmount()
})

test('this week runs Monday to Sunday, left to right, coloured by hours', ZH, async ($, on) => {
  const h = 3_600_000
  on('command.list', () => ({ value: BOTH }))
  on('clock.now', () => ({ value: NOW })) // 2026-11-17 週二；週一是 11-16
  on(
    'state.get',
    seed({
      'usage-meter.showTime': true,
      'usage-time.days': {
        '2026-11-16': { active: 3 * h, work: 0 }, // 週一 2 小時以上：紅
        '2026-11-17': { active: 1.5 * h, work: 0 }, // 週二 1–2 小時：深藍
      },
    }),
  )

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: '使用時間' } })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  const order = ['一', '二', '三', '四', '五', '六', '日'].map(d => texts.indexOf(d))
  expect(order.every((i, n) => i > -1 && (n === 0 || i > order[n - 1]!))).toBe(true)
  expect(texts).toContain('180m')
  expect(texts).toContain('90m')

  const colours = (await ui.findAll({ type: 'Box' }))
    .map(b => b.props.backgroundColor)
    .filter(c => c === '#FF5561' || c === '#1A67F8' || c === '#0DCAFE' || c === 'subtle')
  expect(colours.slice(0, 2)).toEqual(['#FF5561', '#1A67F8'])
  await ui.unmount()
})

test('only time open: no quotas in the widget', ZH, async ($, on) => {
  on('command.list', () => ({ value: BOTH }))
  on('clock.now', () => ({ value: NOW }))
  on(
    'state.get',
    seed({
      'usage-meter.showTime': true,
      'usage-meter.limits': [{ kind: 'five_hour', percentUsed: 28 }],
    }),
  )

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: '使用時間' } })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => t.includes('剩餘'))).toBe(false)
  expect(texts.some(t => t.includes('今天（所有對話）'))).toBe(true)
  await ui.unmount()
})

test('alone, the widget shows only the quotas', ZH, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: NOW }))
  on(
    'state.get',
    seed({
      'usage-meter.showUsage': true,
      'usage-meter.showTime': true, // 沒裝 usage-time 時不算數
      'usage-meter.limits': [{ kind: 'five_hour', percentUsed: 28 }],
    }),
  )

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: '用量' } })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => t.includes('使用時間'))).toBe(false)
  expect(texts.some(t => t.includes('72'))).toBe(true)
  await ui.unmount()
})

test('each day records how much of the 7-day quota went up; drops are not counted', ZH, async ($, on) => {
  let stored: unknown = undefined
  let now = new Date(2026, 10, 17, 9, 0).getTime()
  on('clock.now', () => ({ value: now }))
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e) => {
    stored = e.value
    return { value: undefined }
  })
  on('session.measure', (_, e) => ({ changed: e.changed }))

  const measure = (sevenDay: number) =>
    $.session.measure({
      context: { window: 200_000 },
      rateLimits: [{ kind: 'seven_day', percentUsed: sevenDay }],
      changed: ['rateLimits'],
    } as never)

  await measure(30) // 第一次只當基準
  await measure(34) // +4
  await measure(40) // +6
  await measure(25) // 舊用量滾出視窗：不算
  now = new Date(2026, 10, 18, 10, 0).getTime()
  await measure(28) // 隔天 +3

  expect(stored).toEqual({ last: 28, days: { '2026-11-17': 10, '2026-11-18': 3 } })
})

const CAL_STATE = {
  'usage-meter.showUsage': true,
  'usage-meter.limits': [{ kind: 'seven_day', percentUsed: 40 }],
  'usage-meter.dailyWeekUse': {
    '2026-11-15': 5, // 上週日：10% 以內 → 淺藍
    '2026-11-16': 15, // 週一：10–20% → 深藍
    '2026-11-17': 25, // 週二（今天）：超過 20% → 紅
  },
}

test('on desktop the calendar is one SVG of rounded squares, Monday to Sunday top to bottom', ZH, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: NOW })) // 2026-11-17 週二
  on('state.get', seed(CAL_STATE))

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: '用量' } })
  const svg = String((await ui.find({ type: 'Svg' }))?.props.source ?? '')
  const rects = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" rx="([\d.]+)" fill="([^"]+)"><title>([^<]+)<\/title>/g)]
    .map(m => ({ x: +m[1]!, y: +m[2]!, w: +m[3]!, h: +m[4]!, rx: +m[5]!, fill: m[6]!, title: m[7]! }))

  expect(rects.length).toBeGreaterThan(20)
  expect(rects.every(r => r.w === r.h && r.rx > 0)).toBe(true) // 正方形、圓角
  const byTitle = (t: string) => rects.find(r => r.title.startsWith(t))
  expect(byTitle('11/16')?.fill).toBe('#1A67F8')
  expect(byTitle('11/17')?.fill).toBe('#FF5561')
  expect(byTitle('11/15')?.fill).toBe('#0DCAFE')
  expect(byTitle('11/18')).toBeUndefined() // 明天還沒到
  // 週一在上、週二在它正下方；上週日在左邊一欄的最下面。
  expect(byTitle('11/17')!.y).toBeGreaterThan(byTitle('11/16')!.y)
  expect(byTitle('11/17')!.x).toBe(byTitle('11/16')!.x)
  expect(byTitle('11/15')!.x).toBeLessThan(byTitle('11/16')!.x)
  expect(byTitle('11/15')!.y).toBeGreaterThan(byTitle('11/17')!.y)
  await ui.unmount()
})

test('in the terminal the calendar falls back to coloured boxes', ZH, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: NOW }))
  on('state.get', seed(CAL_STATE))

  const ui = await $.ui.mount({
    ...PANE,
    surface: 'terminal',
    props: { ...PANE.props, title: '用量', placement: 'dock' },
  })
  const cells = (await ui.findAll({ type: 'Box' })).filter(
    b => b.props.width === 2 && b.props.height === 1,
  )
  const weeks = cells.length / 7
  expect(Number.isInteger(weeks) && weeks >= 4).toBe(true)
  const cell = (row: number, col: number) => cells[row * weeks + col]?.props.backgroundColor
  const last = weeks - 1
  expect(cell(0, last)).toBe('#1A67F8')
  expect(cell(1, last)).toBe('#FF5561')
  expect(cell(6, last - 1)).toBe('#0DCAFE')
  expect(cell(0, 0)).toBe('subtle')
  await ui.unmount()
})

test('on desktop the quota bars use the same grey as the calendar squares', ZH, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: NOW }))
  on('state.get', seed(CAL_STATE))

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: '用量' } })
  const svg = String((await ui.find({ type: 'Svg' }))?.props.source ?? '')
  const emptyFill = /<rect [^>]*fill="(rgba\([^"]+\))"/.exec(svg)?.[1] // 空方格的灰
  const barGreys = (await ui.findAll({ type: 'Box' }))
    .map(b => b.props.backgroundColor)
    .filter(c => typeof c === 'string' && c.startsWith('rgba'))
  expect(emptyFill).toBeDefined()
  expect(barGreys.length).toBeGreaterThan(0)
  expect(barGreys.every(c => c === emptyFill)).toBe(true)
  // 「7 天」和「每天用掉的 7 天額度」是同一種字。
  const texts = await ui.findAll({ type: 'Text' })
  const style = (t: string) => JSON.stringify(texts.find(x => x.text === t)?.props)
  expect(style('7 天')).toBe(style('每天用掉的 7 天額度'))
  await ui.unmount()
})

test('the time part shows this week split by folder, in TCAN colours', ZH, async ($, on) => {
  on('command.list', () => ({ value: BOTH }))
  on('clock.now', () => ({ value: NOW }))
  on(
    'state.get',
    seed({
      'usage-meter.showTime': true,
      'usage-time.days': {
        '2026-11-16': { active: 90 * 60_000, work: 0, folders: { 'my-project': 60 * 60_000, notes: 30 * 60_000 } },
        '2026-11-17': { active: 30 * 60_000, work: 0, folders: { 'my-project': 30 * 60_000 } },
      },
    }),
  )

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: '使用時間' } })
  const texts = await ui.findAll({ type: 'Text' })
  const words = texts.map(x => x.text)
  expect(words).toContain('本週各資料夾')
  expect(words[words.indexOf('本週各資料夾') + 1]).toBe('120m') // 本週總計放在標題後面
  expect(words).not.toContain('本週') // 原本那一行拿掉了
  expect(words).toContain('75% · 90m')
  expect(words).toContain('25% · 30m')
  const dots = texts.filter(x => x.text === '■ ').map(x => x.props.color)
  expect(dots).toEqual(['#1A67F8', '#0DCAFE']) // 第一名藍、第二名青藍
  await ui.unmount()
})

test('in English, the button reads in English', EN, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: NOW }))

  const band = await $.ui.mount(BAND)
  expect((await band.find({ type: 'Button', key: 'toggle' }))?.props.label).toBe('▯▯▯ Usage')
  await band.unmount()
})

test('in English, the widget reads in English', EN, async ($, on) => {
  on('command.list', () => ({ value: [command('usage-meter')] }))
  on('clock.now', () => ({ value: NOW }))
  on(
    'state.get',
    seed({
      'usage-meter.showUsage': true,
      'usage-meter.limits': [{ kind: 'five_hour', percentUsed: 28 }],
    }),
  )
  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, title: 'Usage' } })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts).toContain('5-hour')
  expect(texts).toContain('% left')
  expect(texts).toContain('28% used')
  expect(texts).toContain('7-day limit used per day')
  expect(texts.some(t => /[\u4e00-\u9fff]/.test(t))).toBe(false)
  await ui.unmount()
})
