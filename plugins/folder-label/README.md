# 資料夾標籤（folder-label）

**繁體中文** · [English](./README.en.md)

在輸入框上方的左邊顯示這個對話所在的資料夾，例如 `❐ my-project`。**不耗費 token**。

- 只寫資料夾的最後一層名稱，灰色字。
- 側邊欄用自訂分組時看不到資料夾，用這行對照。
- **跟 usage-meter 一起裝**：資料夾名稱由 usage-meter 畫在按鈕那一行的左邊，這個 mod 自動不顯示，不會出現兩次。
- 只有符號和資料夾名稱，沒有需要翻譯的文字。

## 安裝

在合輯根目錄（有 `.claude-plugin/marketplace.json` 的那一層）加入 marketplace 後安裝，完整步驟見[合輯 README](../../README.md#三安裝)：

```bash
claude plugin install folder-label@tcan-claude-mods
```

## 移除

```bash
claude plugin uninstall folder-label@tcan-claude-mods
```
