// 介面文字（繁體中文／English）。要改台詞或加語言，只改這個檔案。
// UI text (Traditional Chinese / English). Edit only this file to change lines or add a language.

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
    tools: {
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
    } as Record<string, string>,
    mcp: '罐罐連線外部工具中',
    modes: {
      thinking: '罐罐思考中',
      requesting: '罐罐出發中',
      'tool-use': '罐罐動手做',
      'tool-input': '罐罐動手做',
      responding: '罐罐回覆中',
    } as Record<string, string>,
    working: '罐罐動手做',
    altWalk: '像素罐罐在踏步',
    altWorking: '像素罐罐在工作',
    altTcan: 'TCAN 像素圖示',
    altEarth: '旋轉的像素地球',
    altWink: '像素罐罐眨眼',
    altIdle: '像素罐罐',
    tcan: 'TCAN 台灣氣候行動網絡',
    earth: '跑好久了，地球轉一下～',
    done: '搞定！✨',
    hello: '罐罐說你好！一起為氣候採取行動 🌍',
  },
  en: {
    tools: {
      Bash: 'CAN is running a command',
      Read: 'CAN is reading',
      Grep: 'CAN is looking for clues',
      Glob: 'CAN is finding files',
      Edit: 'CAN is editing',
      Write: 'CAN is writing',
      NotebookEdit: 'CAN is writing',
      WebSearch: 'CAN is searching the web',
      WebFetch: 'CAN is reading a web page',
      Agent: 'CAN is calling for help',
      Skill: 'CAN is reading the manual',
    } as Record<string, string>,
    mcp: 'CAN is connecting to an outside tool',
    modes: {
      thinking: 'CAN is thinking',
      requesting: 'CAN is setting off',
      'tool-use': 'CAN is on it',
      'tool-input': 'CAN is on it',
      responding: 'CAN is replying',
    } as Record<string, string>,
    working: 'CAN is on it',
    altWalk: 'Pixel CAN marching in place',
    altWorking: 'Pixel CAN at work',
    altTcan: 'Pixel TCAN icon',
    altEarth: 'Spinning pixel Earth',
    altWink: 'Pixel CAN winking',
    altIdle: 'Pixel CAN',
    tcan: 'Taiwan Climate Action Network (TCAN)',
    earth: 'Taking a while—let the Earth spin~',
    done: 'Done! ✨',
    hello: "CAN says hi! Let's act on climate together 🌍",
  },
}

export type Strings = (typeof STRINGS)['zh-Hant']
