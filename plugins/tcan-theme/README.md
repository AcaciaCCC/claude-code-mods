# TCAN 主題（tcan-theme）

> 在 claude-code-mods 合集裡，下面的 `<資料夾路徑>` 請填**合集的根目錄**（有 `.claude-plugin/marketplace.json` 的那一層），不是這個子資料夾。完整說明見[合集 README](../../README.md)。

把 Claude 桌面版介面換成 TCAN 台灣氣候行動網絡的配色：TCAN 藍 `#1D5BD0`、深藍 `#000066`、天藍 `#59CEEE`、暖化紅 `#E04A56`。固定淺色模式，程式碼與 Git 顏色也換成 TCAN 色系。

## 會改到什麼

- 按鈕、連結、開關、選取狀態、焦點框：TCAN 藍
- 錯誤與刪除：暖化紅
- 左側欄：淡 TCAN 藍；對話頁面：帶藍的灰白；面板：白
- 程式碼：`github-light` 配色（藍、深藍、紅）；App 不提供時改用 TCAN 色延伸的配色
- Git：新增藍、刪除紅、修改天藍、合併深藍

只有 **Claude 桌面版與手機版 App** 會顯示主題。終端機與編輯器裡的 Claude Code 不會變色。字體與版面無法用主題更改。

## 安裝

需要已安裝 Claude Code（桌面 App 內建的也可以）。把這個資料夾放在電腦上固定的位置（之後不要移動或刪除），然後在終端機執行，`<資料夾路徑>` 換成這個資料夾的完整路徑：

```bash
claude plugin marketplace add "<資料夾路徑>"
```

```bash
claude plugin install tcan-theme@tcan-claude-mods
```

或在 Claude Code 的輸入框中輸入：

```
/plugin marketplace add <資料夾路徑>
/plugin install tcan-theme@tcan-claude-mods
```

裝好後開一個新對話，主題就會套用；之後每個新對話都會自動套用。

## 修改顏色

顏色都在 `hooks/register.ts`。改完後在 Claude Code 輸入 `/reload-plugins` 即可生效，不用重新安裝。

## 移除

```bash
claude plugin uninstall tcan-theme@tcan-claude-mods
```

移除後介面回到 App 原本的樣子。

## 說明

配色取自 tcan2050.org.tw 網站。這是 TCAN 組織的識別色，若要對外公開發佈，請先與 TCAN 確認。
