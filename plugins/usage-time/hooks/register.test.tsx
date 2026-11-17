import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'usage-time',
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

const command = (name: string, plugin: string) => ({
  name,
  description: '',
  source: 'plugin' as const,
  plugin,
})

test('alone, it draws its own time button', async ($, on) => {
  on('command.list', () => ({ value: [command('usage-time', 'usage-time')] }))
  on('state.get', (_, e, next) =>
    e.key === 'sessionMs' ? { value: { value: 10 * 60_000, version: 1 } } : next(e),
  )

  const ui = await $.ui.mount(BAND)
  const button = await ui.find({ type: 'Button', key: 'toggle' })
  expect(button?.props.label).toBe('◷ 10m')
  await ui.unmount()
})

test('with usage-meter installed, it leaves the row to usage-meter', async ($, on) => {
  on('command.list', () => ({
    value: [command('usage-time', 'usage-time'), command('usage-meter', 'usage-meter')],
  }))

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Button' })).toBeUndefined()
  await ui.unmount()
})

test('with usage-meter installed, `/usage-time` points to the shared widget', async ($, on) => {
  on('command.list', () => ({
    value: [command('usage-time', 'usage-time'), command('usage-meter', 'usage-meter')],
  }))
  on('ui.panes', () => ({ value: [] }))

  const r = await $.command.run({ command: 'usage-time', args: '' } as never)
  expect(r.text).toContain('◷')
})

test('time runs from the first message to the last; a gap over 30 minutes is left out; overlaps count once', async ($, on) => {
  const t = (h: number, m: number) => new Date(2026, 10, 17, h, m).getTime()
  // 另一個對話已經記了 09:10–09:30，跟這個對話重疊。
  let stored: unknown = { '2026-11-17': { spans: [[t(9, 10), t(9, 30)]], work: 0 } }
  let now = t(9, 0)
  const at = (h: number, m: number) => (now = t(h, m))
  on('clock.now', () => ({ value: now }))
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e) => {
    stored = e.value
    return { value: undefined }
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('session.cwd', () => ({ value: '/Users/me/Desktop/claude閒聊' }))

  const send = () =>
    $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } } as never)
  at(9, 0)
  await send() // 第一則：還不算
  at(9, 20)
  await send() // +20m
  at(9, 40)
  await send() // +20m
  at(13, 0)
  await send() // 隔 3h20m：不算
  at(13, 10)
  await send() // +10m

  // 這個對話的時段記上資料夾；另一個對話舊的 09:10–09:30 沒有資料夾，分開放。
  expect(stored).toEqual({
    '2026-11-17': {
      spans: [
        [t(9, 0), t(9, 40), 'claude閒聊'],
        [t(9, 10), t(9, 30)],
        [t(13, 0), t(13, 10), 'claude閒聊'],
      ],
      work: 0,
    },
  })
})

test('a span across midnight is split between the two days', async ($, on) => {
  let stored: unknown = undefined
  let now = new Date(2026, 10, 17, 23, 50).getTime()
  on('clock.now', () => ({ value: now }))
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e) => {
    stored = e.value
    return { value: undefined }
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('session.cwd', () => ({ value: '/Users/me/Desktop/claude閒聊' }))
  const send = () =>
    $.prompt.submit({ text: 'hi', wait: false, origin: { kind: 'composer' } } as never)

  await send()
  now = new Date(2026, 10, 18, 0, 10).getTime()
  await send()

  const midnight = new Date(2026, 10, 18).getTime()
  expect(stored).toEqual({
    '2026-11-17': { spans: [[midnight - 10 * 60_000, midnight, 'claude閒聊']], work: 0 },
    '2026-11-18': { spans: [[midnight, midnight + 10 * 60_000, 'claude閒聊']], work: 0 },
  })
})

test('a finished main turn counts toward Claude work only; a subagent turn does not', async ($, on) => {
  let stored: unknown = undefined
  on('clock.now', () => ({ value: new Date(2026, 10, 17, 15, 0).getTime() }))
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e) => {
    stored = e.value
    return { value: undefined }
  })
  on('turn.complete', () => ({ text: '' }))

  const base = { answer: '', isAborted: false, reason: 'completed' }
  await $.turn.complete({ ...base, turnId: 't1', durationMs: 120_000 } as never)
  await $.turn.complete({ ...base, turnId: 't2', durationMs: 999_000, agentId: 'a1' } as never)

  expect(stored).toEqual({ '2026-11-17': { spans: [], work: 120_000 } })
})

test('the widget shows this week split by folder, with totals that count overlaps once', async ($, on) => {
  const t = (d: number, h: number, m: number) => new Date(2026, 10, d, h, m).getTime()
  on('command.list', () => ({ value: [command('usage-time', 'usage-time')] }))
  on('clock.now', () => ({ value: t(17, 15, 0) }))
  on('state.get', (_, e, next) =>
    e.key === 'days'
      ? {
          value: {
            value: {
              '2026-11-16': { active: 90 * 60_000, work: 0, folders: { 'claude閒聊': 60 * 60_000, TCAN: 30 * 60_000 } },
              '2026-11-17': { active: 30 * 60_000, work: 0, folders: { 'claude閒聊': 30 * 60_000 } },
            },
            version: 1,
          },
        }
      : next(e),
  )

  const ui = await $.ui.mount({
    plugin: 'usage-time',
    component: 'Pane',
    requestId: 'usage-time',
    surface: 'desktop',
    props: { title: '使用時間', isFocused: false, bodyColumns: 36, placement: 'widget', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  } as const)
  const texts = (await ui.findAll({ type: 'Text' })).map(x => x.text)
  expect(texts).toContain('本週各資料夾')
  expect(texts[texts.indexOf('本週各資料夾') + 1]).toBe('120m') // 本週總計放在標題後面
  expect(texts).not.toContain('本週') // 原本那一行拿掉了
  expect(texts).toContain('claude閒聊')
  expect(texts).toContain('75% · 90m')
  expect(texts).toContain('TCAN')
  expect(texts).toContain('25% · 30m')
  await ui.unmount()
})
