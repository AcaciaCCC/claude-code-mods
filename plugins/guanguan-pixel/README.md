# 罐罐像素動畫（guanguan-pixel）

> 在 claude-code-mods 合集裡，下面的 `<資料夾路徑>` 請填**合集的根目錄**（有 `.claude-plugin/marketplace.json` 的那一層），不是這個子資料夾。完整說明見[合集 README](../../README.md)。

把 TCAN 台灣氣候行動網絡的吉祥物「罐罐」做成像素動畫，放進 Claude 桌面版 App。罐罐是一個身上有增溫條的小罐頭。

## 效果

| 時機 | 畫面 |
| --- | --- |
| Claude 工作中 | 「運作中」那一列換成踏步的罐罐，台詞跟著工具變：罐罐思考中…、罐罐跑指令中…、罐罐翻資料中…、罐罐上網查資料… 等 |
| 每天第一則訊息（台灣時間） | 輸入框上方置中出現罐罐，泡泡說「罐罐說你好！一起為氣候採取行動 🌍」，6 秒 |
| Claude 做完事 | 罐罐「>」眨眼，泡泡說「搞定！✨」，4 秒 |
| 訊息裡有「TCAN」（不分大小寫） | 置中跳出像素 TCAN 圖示，8 秒，沒有文字 |
| Claude 跑超過 1 分鐘 | 像素地球出來快轉，「跑好久了，地球轉一下～」，8 秒，之後每分鐘一次 |

平常輸入框上方是空的，罐罐只在上面這些時刻出現。動畫在電腦上播放，**不會耗費 token**。

只有 **Claude 桌面 App** 會顯示罐罐（輸入框上方的部分手機 App 也會）。終端機與編輯器裡的 Claude Code 不會顯示。

## 安裝

需要已安裝 Claude Code（桌面 App 內建的也可以）。

1. 把這個資料夾放在電腦上固定的位置（裝好後不要移動或刪除，Claude 會直接從這裡讀取）。
2. 在終端機執行下面兩行，`<資料夾路徑>` 換成這個資料夾的完整路徑（可以把資料夾拖進終端機視窗，路徑就會自動填上）：

```bash
claude plugin marketplace add "<資料夾路徑>"
```

```bash
claude plugin install guanguan-pixel@tcan-claude-mods
```

或在終端機的 Claude Code 輸入框中輸入：

```
/plugin marketplace add <資料夾路徑>
/plugin install guanguan-pixel@tcan-claude-mods
```

裝好後開一個新對話，罐罐就會出現；之後每個新對話、每個視窗都會自動有罐罐。

> 用的是 Claude 桌面 App 內建的 Claude Code、終端機打 `claude` 找不到指令時：把 `claude` 換成 App 內建程式的完整路徑，或請 Claude 幫你執行上面兩行。

## 修改

- **台詞、秒數、關鍵字**：都在 `hooks/register.tsx` 最上面，例如 `HELLO_MS`（招呼秒數）、`DONE_MS`、`TCAN_MS`、`LONG_MS`（多久算跑太久）、`TCAN_WORDS`（觸發 TCAN 圖示的詞）、`TOOL_WORDS`（各工具的台詞）。
- **像素圖**：由 `tools/` 裡的 Python 程式產生（`gen2.py` 罐罐、`earth.py` 地球、`logo.py` TCAN 圖示）。改完圖後在這個資料夾執行：

```bash
{ python3 tools/gen2.py ts; python3 tools/earth.py ts; python3 tools/logo.py ts; } > hooks/sprite.ts
```

改完後在 Claude Code 輸入 `/reload-plugins` 就會生效，不用重新安裝。

## 移除

```bash
claude plugin uninstall guanguan-pixel@tcan-claude-mods
```

## 說明

罐罐造型參考 LINE 貼圖「罐罐說你好」，TCAN 圖示取自 tcan2050.org.tw，皆為 TCAN 的識別。若要對外公開發佈，請先與 TCAN 確認。
