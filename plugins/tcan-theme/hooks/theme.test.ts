import { expect, test } from 'claude-code/testing'

import { problems } from './register'

test('desktop paints the TCAN look', async () => {
  expect(problems.filter(l => l.startsWith("Desktop won't paint"))).toEqual([])
})

test('the look is set at session start', async ($, on) => {
  let sent = false
  on('theme.set', () => {
    sent = true
    return { value: { isDrawn: true, requestId: 't' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sent).toBe(true)
})

