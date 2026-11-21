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

export const STRINGS = {
  'zh-Hant': {
    title: '使用時間',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    unsorted: '未分類（記資料夾之前）',
    other: '其他',
    closedMsg: '已收起使用時間。',
    openedMsg: '已打開使用時間。',
    notOpened: '使用時間小工具沒有打開。',
    commandDescription: '打開或收起使用時間小工具',
    inMeter: '使用時間和額度在同一個小工具裡：請按輸入框右上方的「◷」按鈕。',
    close: '收起',
    todayAll: '今天（所有對話）',
    weekFolders: '本週各資料夾',
    note: '從第一則到最後一則訊息；隔超過 30 分鐘不算',
  },
  en: {
    title: 'Time spent',
    weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    unsorted: 'Unsorted (before folders were tracked)',
    other: 'Other',
    closedMsg: 'Time spent closed.',
    openedMsg: 'Time spent opened.',
    notOpened: "The time-spent widget didn't open.",
    commandDescription: 'Open or close the time-spent widget',
    inMeter: 'Time spent shares a widget with your usage limits: use the ◷ button above the prompt box, on the right.',
    close: 'Close',
    todayAll: 'Today (all conversations)',
    weekFolders: 'This week by folder',
    note: "First to last message; gaps over 30 min don't count",
  },
}

export type Strings = (typeof STRINGS)['zh-Hant']
