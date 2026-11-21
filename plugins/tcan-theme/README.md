# TCAN 主題（tcan-theme）

**繁體中文** · [English](./README.en.md)

把 Claude 桌面版介面換成 TCAN 台灣氣候行動網絡的配色：TCAN 藍 `#1D5BD0`、深藍 `#000066`、天藍 `#1B87B0`、暖化紅 `#E04A56`。固定淺色模式，程式碼與 Git 顏色也換成 TCAN 色系。沒有文字，所以沒有語言設定。

## 會改到什麼

- 按鈕、連結、開關、選取狀態、焦點框：TCAN 藍
- 錯誤與刪除：暖化紅
- 左側欄：淡 TCAN 藍；對話頁面：帶藍的灰白；面板：白
- 程式碼：`github-light` 配色；App 不提供時改用 TCAN 色延伸的配色
- Git：新增藍、刪除紅、修改天藍、合併深藍

只有 **Claude 桌面版與手機版 App** 會顯示主題；終端機與編輯器裡的 Claude Code 不會變色，字體與版面也無法用主題更改。

## 安裝

在合輯根目錄（有 `.claude-plugin/marketplace.json` 的那一層）加入 marketplace 後安裝，完整步驟見[合輯 README](../../README.md#三安裝)：

```bash
claude plugin install tcan-theme@tcan-claude-mods
```

## 移除

```bash
claude plugin uninstall tcan-theme@tcan-claude-mods
```

## 修改顏色

顏色都在 [`hooks/register.ts`](hooks/register.ts)。改完在 Claude Code 輸入 `/reload-plugins` 即可生效。

## 授權

程式碼 MIT；配色是 TCAN 台灣氣候行動網絡的識別色（取自 tcan2050.org.tw）。
