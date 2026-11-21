// 介面文字（繁體中文／English）。要改字或加語言，只改這個檔案。
// UI text (Traditional Chinese / English). Edit only this file to change wording or add a language.

export type Lang = 'zh-Hant' | 'en'

/** 設定的 language：'auto' 跟著系統語言（zh 開頭用繁中，其他用英文）。 */
export function pickLang(setting: unknown): Lang {
  if (setting === 'zh-Hant' || setting === 'en') return setting
  let locale = ''
  try {
    locale = Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    // 沒有 Intl 就用英文。
  }
  return /^zh/i.test(locale) ? 'zh-Hant' : 'en'
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const STRINGS = {
  'zh-Hant': {
    title: '用量',
    titleBoth: '用量與時間',
    titleTime: '使用時間',
    fiveHour: '5 小時',
    sevenDay: '7 天',
    usageButton: '用量',
    close: '收起',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天',
    tomorrow: '明天',
    dateLabel: (d: Date) => `${d.getMonth() + 1}/${d.getDate()} 週${STRINGS['zh-Hant'].weekdays[d.getDay()]}`,
    unsorted: '未分類（記資料夾之前）',
    other: '其他',
    month: (m: number) => `${m}月`,
    monthShort: (m: number) => String(m),
    calendarTip: (m: number, d: number, pct: number) => `${m}/${d}：${pct > 0 ? `用掉 ${pct}%` : '沒有用量'}`,
    commandDescription: '打開或收起 5 小時／7 天額度',
    opened: '已打開額度。',
    closed: '已收起額度。',
    headingUsage: '額度',
    headingTime: '使用時間',
    noLimits: '下一次回覆後顯示額度',
    left: '% 剩餘',
    used: (n: number) => `已用 ${n}%`,
    calendar: '每天用掉的 7 天額度',
    calendarAlt: (weeks: number) => `最近 ${weeks} 週每天用掉的 7 天額度`,
    todayAll: '今天（所有對話）',
    weekFolders: '本週各資料夾',
    note: '從第一則到最後一則訊息；隔超過 30 分鐘不算',
  },
  en: {
    title: 'Usage',
    titleBoth: 'Usage & time',
    titleTime: 'Time spent',
    fiveHour: '5-hour',
    sevenDay: '7-day',
    usageButton: 'Usage',
    close: 'Close',
    weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    today: 'Today',
    tomorrow: 'Tomorrow',
    dateLabel: (d: Date) => `${STRINGS.en.weekdays[d.getDay()]} ${MONTHS_EN[d.getMonth()]} ${d.getDate()}`,
    unsorted: 'Unsorted (before folders were tracked)',
    other: 'Other',
    month: (m: number) => MONTHS_EN[m - 1] ?? String(m),
    monthShort: (m: number) => (MONTHS_EN[m - 1] ?? String(m)).slice(0, 2),
    calendarTip: (m: number, d: number, pct: number) =>
      `${MONTHS_EN[m - 1]} ${d}: ${pct > 0 ? `${pct}% used` : 'no usage'}`,
    commandDescription: 'Open or close the 5-hour / 7-day usage limits',
    opened: 'Usage limits opened.',
    closed: 'Usage limits closed.',
    headingUsage: 'Limits',
    headingTime: 'Time spent',
    noLimits: 'Limits appear after the next reply',
    left: '% left',
    used: (n: number) => `${n}% used`,
    calendar: '7-day limit used per day',
    calendarAlt: (weeks: number) => `7-day limit used per day, last ${weeks} weeks`,
    todayAll: 'Today (all conversations)',
    weekFolders: 'This week by folder',
    note: "First to last message; gaps over 30 min don't count",
  },
}

export type Strings = (typeof STRINGS)['zh-Hant']
