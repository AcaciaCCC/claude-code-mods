import type { Register } from 'claude-code'

// usage-meter 也裝了的話，資料夾名稱由它畫在按鈕那一行的左邊，這裡就不畫，避免出現兩次。
const METER_COMMAND = 'usage-meter'

export const register: Register = on => {
  // 輸入框上方靠左：「❐ 資料夾名稱」（只寫最後一層）。
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    if ((await $.command.list()).some(c => c.name === METER_COMMAND)) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const cwd = await $.session.cwd()
    const folder = cwd.split('/').filter(Boolean).pop() ?? cwd

    return (
      <Box width="100%">
        <Text color="inactive">❐ {folder}</Text>
      </Box>
    )
  })
}
