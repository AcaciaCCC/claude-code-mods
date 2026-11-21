# 使用時間（usage-time）

**繁體中文** · [English](./README.en.md)

記錄你使用 Claude Code 的時間：輸入框右上方的按鈕 `[ ◷ 47m ]` 是這次對話用了幾分鐘，點開看今天、本週每天、本週各資料夾。**不耗費 token**，紀錄只存在你的電腦上（保留最近 3 週）。

## 看到什麼

- **今天（所有對話）**：所有對話加起來，同時開著的時間只算一次。
- **本週每天**：週一到週日；灰 0、淺藍 1 小時內、深藍 1–2 小時、紅 2 小時以上。
- **本週各資料夾**：本週總時間、分色長條、每個資料夾的百分比與分鐘數（前三名藍、青藍、紅，其餘「其他」）。

**時間怎麼算**：從第一則訊息算到最後一則；兩則之間隔超過 30 分鐘就當作離開，那段不算。

跟 usage-meter 一起裝時，時間畫在它的小工具下半部，由它的「◷」按鈕開關。

## 介面語言

在 `/config` 的「介面語言 / UI language」選 `auto`（跟著系統，預設）、`zh-Hant` 或 `en`。文字都在 [`hooks/strings.ts`](hooks/strings.ts)。

## 安裝

在合輯根目錄（有 `.claude-plugin/marketplace.json` 的那一層）加入 marketplace 後安裝，完整步驟見[合輯 README](../../README.md#三安裝)：

```bash
claude plugin install usage-time@tcan-claude-mods
```

## 移除

```bash
claude plugin uninstall usage-time@tcan-claude-mods
```

## 修改

顏色在 [`hooks/register.tsx`](hooks/register.tsx) 最上面的 `PALETTE`；文字在 [`hooks/strings.ts`](hooks/strings.ts)。測試：`claude plugin test plugins/usage-time`。
