# 罐罐像素動畫（guanguan-pixel）

**繁體中文** · [English](./README.en.md)

把 TCAN 台灣氣候行動網絡的吉祥物「罐罐」（身上有增溫條的小罐頭）做成像素動畫，放進 Claude 桌面 App。動畫在電腦上播放，**不會耗費 token**。

## 效果

| 時機 | 畫面 |
| --- | --- |
| Claude 工作中 | 「運作中」那一列換成踏步的罐罐，台詞跟著工具變：罐罐思考中…、罐罐跑指令中…、罐罐翻資料中…、罐罐上網查資料… |
| 執行中的工具列 | 點點換成踏步小罐罐＋工具描述＋台詞 |
| 每天第一則訊息（電腦當地時間） | 輸入框上方置中出現罐罐：「罐罐說你好！一起為氣候採取行動 🌍」，6 秒 |
| Claude 做完事 | 罐罐眨眼：「搞定！✨」，4 秒 |
| 訊息裡有「TCAN」（不分大小寫） | 置中跳出像素 TCAN 圖示，8 秒 |
| Claude 跑超過 1 分鐘 | 像素地球快轉：「跑好久了，地球轉一下～」，8 秒，之後每分鐘一次 |

只有 **Claude 桌面 App** 會顯示罐罐（輸入框上方的部分手機 App 也會）。

## 介面語言

在 `/config` 的「介面語言 / UI language」選 `auto`（跟著系統，預設）、`zh-Hant` 或 `en`。文字都在 [`hooks/strings.ts`](hooks/strings.ts)。

## 安裝

在合輯根目錄（有 `.claude-plugin/marketplace.json` 的那一層）加入 marketplace 後安裝，完整步驟見[合輯 README](../../README.md#三安裝)：

```bash
claude plugin install guanguan-pixel@tcan-claude-mods
```

## 移除

```bash
claude plugin uninstall guanguan-pixel@tcan-claude-mods
```

## 修改

- **台詞**：[`hooks/strings.ts`](hooks/strings.ts)，中英文並排。
- **秒數、關鍵字**：[`hooks/register.tsx`](hooks/register.tsx) 最上面的 `HELLO_MS`、`DONE_MS`、`TCAN_MS`、`LONG_MS`、`TCAN_WORDS`。
- **像素圖**：由 `tools/` 的 Python 產生（`gen2.py` 罐罐、`earth.py` 地球、`logo.py` TCAN 圖示），在這個資料夾執行：

```bash
{ python3 tools/gen2.py ts; python3 tools/earth.py ts; python3 tools/logo.py ts; } > hooks/sprite.ts
```

改完在 Claude Code 輸入 `/reload-plugins` 就會生效。

## 授權

程式碼 MIT。罐罐造型參考 LINE 貼圖「罐罐說你好」，TCAN 圖示取自 tcan2050.org.tw，皆為 TCAN 的識別，著作權歸 TCAN 所有。
