import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'guanguan-pixel',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a test double for the scene atom
const scene = (value: string): any => (_: unknown, e: { key: string }, next: (e: unknown) => unknown) =>
  e.key === 'scene' ? { value: { value, version: 1 } } : next(e)

for (const [language, hello, done] of [
  ['zh-Hant', '罐罐說你好！一起為氣候採取行動 🌍', '搞定！✨'],
  ['en', "CAN says hi! Let's act on climate together 🌍", 'Done! ✨'],
] as const) {
  test(`${language}: the daily hello`, { options: { language } }, async ($, on) => {
    on('state.get', scene('hello'))
    const ui = await $.ui.mount(BAND)
    expect((await ui.findAll({ type: 'Text' })).map(t => t.text)).toContain(hello)
    await ui.unmount()
  })

  test(`${language}: done`, { options: { language } }, async ($, on) => {
    on('state.get', scene('done'))
    const ui = await $.ui.mount(BAND)
    expect((await ui.findAll({ type: 'Text' })).map(t => t.text)).toContain(done)
    await ui.unmount()
  })
}

test('auto picks a language without failing', async ($, on) => {
  on('state.get', scene('earth'))
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true } })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts.some(t => t === '跑好久了，地球轉一下～' || t === 'Taking a while—let the Earth spin~')).toBe(true)
  await ui.unmount()
})
