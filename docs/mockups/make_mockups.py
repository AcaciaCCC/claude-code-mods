#!/usr/bin/env python3
"""用範例數字畫 README 的示意圖（中英各一套）。不含任何真實用量。
Draws the README illustrations from example numbers (zh-Hant and en). No real usage data.

用法 / usage: python3 docs/mockups/make_mockups.py
輸出 / output: docs/images/mockups/*.svg
"""
from pathlib import Path
import html

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/images/mockups"
WALK = (ROOT / "docs/images/walk.svg").read_text(encoding="utf-8")

FONT = "-apple-system, 'PingFang TC', 'Noto Sans TC', 'Segoe UI', sans-serif"
INK, MUTED, LINE, BG, CARD = "#1d2433", "#6b7280", "#e5e7eb", "#f8f9fc", "#ffffff"
BLUE, TEAL, RED, GREY = "#1A67F8", "#0DCAFE", "#FF5561", "rgba(138,143,152,0.28)"
STRIPES = ["#08306B", "#08519C", "#2171B5", "#4292C6", "#6BAED6", "#9ECAE1", "#C6DBEF", "#DEEBF7",
           "#FEE0D2", "#FCBBA1", "#FC9272", "#FB6A4A", "#EF3B2C", "#CB181D", "#A50F15", "#67000D"]

T = {
    "zh-Hant": dict(title="用量與時間", limits="額度", five="5 小時", seven="7 天", left="% 剩餘",
                    used="已用 {}%", r5="↻ 今天 23:00", r7="↻ 11/26 週四 11:00", cal="每天用掉的 7 天額度",
                    months=["10月", "11月"], time="使用時間", today="今天（所有對話）",
                    week=["一", "二", "三", "四", "五", "六", "日"], folders="本週各資料夾",
                    note="從第一則到最後一則訊息；隔超過 30 分鐘不算", close="收起",
                    working="罐罐跑指令中…", tokens="389 個 Token", prompt="輸入訊息…"),
    "en": dict(title="Usage & time", limits="Limits", five="5-hour", seven="7-day", left="% left",
               used="{}% used", r5="↻ Today 23:00", r7="↻ Thu Nov 26 11:00", cal="7-day limit used per day",
               months=["Oct", "Nov"], time="Time spent", today="Today (all conversations)",
               week=["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], folders="This week by folder",
               note="First to last message; gaps over 30 min don't count", close="Close",
               working="CAN is running a command…", tokens="389 tokens", prompt="Message…"),
}

# 範例數字 / example numbers
FIVE_USED, SEVEN_USED = 38, 29
WEEK_MIN = [85, 47, None, None, None, None, None]  # 週一、週二（今天）
FOLDERS = [("my-project", 84, BLUE), ("notes", 48, TEAL)]
CAL = {(6, 0): 6, (6, 2): 14, (6, 3): 4, (7, 0): 9, (7, 1): 22, (7, 4): 3, (8, 0): 12, (8, 1): 7}


def text(x, y, s, size=13, fill=INK, weight=400, anchor="start"):
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}">{html.escape(s)}</text>')


def bar(x, y, w, used):
    n, gap = 20, 2
    cw = (w - gap * (n - 1)) / n
    out = []
    for i in range(n):
        fill = STRIPES[min(15, int(i / n * 16))] if i < round(used / 100 * n) else GREY
        out.append(f'<rect x="{x + i * (cw + gap):.1f}" y="{y}" width="{cw:.1f}" height="12" fill="{fill}"/>')
    return "".join(out)


def use_color(p):
    return TEAL if p <= 10 else BLUE if p <= 20 else RED


def widget(lang):
    t = T[lang]
    W, P = 340, 20
    o = [f'<rect x="0.5" y="0.5" width="{W - 1}" height="{779}" rx="12" fill="{CARD}" stroke="{LINE}"/>',
         text(P, 32, t["title"], 14, INK, 600), f'<line x1="0" y1="50" x2="{W}" y2="50" stroke="{LINE}"/>']
    y = 82
    o.append(text(P, y, t["limits"], 13, MUTED, 700))
    for name, used, reset in ((t["five"], FIVE_USED, t["r5"]), (t["seven"], SEVEN_USED, t["r7"])):
        y += 30
        o.append(text(P, y, name, 13, MUTED))
        left = 100 - used
        o.append(f'<text x="{W - P}" y="{y}" text-anchor="end" font-family="{FONT}" font-size="13" fill="{MUTED}">'
                 f'<tspan font-weight="700" fill="{BLUE}">{left}</tspan>{html.escape(t["left"])}</text>')
        o.append(bar(P, y + 10, W - 2 * P, used))
        o.append(text(P, y + 42, t["used"].format(used), 13, MUTED))
        o.append(text(P, y + 62, reset, 13, TEAL))
        y += 70
    y += 26
    o.append(text(P, y, t["cal"], 13, MUTED))
    y += 22
    o.append(text(P, y, t["months"][0], 11, MUTED))
    o.append(text(P + 5 * 20, y, t["months"][1], 11, MUTED))
    y += 8
    for col in range(9):
        for row in range(7):
            if col == 8 and row > 1:
                continue
            p = CAL.get((col, row), 0)
            fill = use_color(p) if p else GREY
            o.append(f'<rect x="{P + col * 20}" y="{y + row * 20}" width="16" height="16" rx="3.5" fill="{fill}"/>')
    y += 7 * 20 + 34
    o.append(text(P, y, t["time"], 13, MUTED, 700))
    y += 28
    o.append(text(P, y, t["today"], 13, MUTED))
    o.append(text(W - P, y, "47m", 15, INK, 700, "end"))
    y += 26
    cw = (W - 2 * P) / 7
    for i, (d, m) in enumerate(zip(t["week"], WEEK_MIN)):
        cx = P + i * cw + cw / 2
        is_today = i == 1
        o.append(text(cx, y, d, 13, INK if is_today else MUTED, 700 if is_today else 400, "middle"))
        if m is not None:
            fill = TEAL if m < 60 else BLUE if m < 120 else RED
            o.append(f'<rect x="{P + i * cw + 3:.1f}" y="{y + 8}" width="{cw - 6:.1f}" height="14" fill="{fill}"/>')
            o.append(text(cx, y + 40, f"{m}m", 13, INK if is_today else MUTED, 700 if is_today else 400, "middle"))
    y += 70
    total = sum(m for _, m, _ in FOLDERS)
    o.append(text(P, y, t["folders"], 13, MUTED))
    o.append(text(W - P, y, f"{total}m", 13, INK, 400, "end"))
    y += 12
    x = P
    for _, m, c in FOLDERS:
        w = (W - 2 * P) * m / total
        o.append(f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="14" fill="{c}"/>')
        x += w
    y += 14
    for name, m, c in FOLDERS:
        y += 24
        o.append(f'<rect x="{P}" y="{y - 10}" width="10" height="10" fill="{c}"/>')
        o.append(text(P + 18, y, name, 13))
        o.append(text(W - P, y, f"{round(m / total * 100)}% · {m}m", 13, MUTED, 400, "end"))
    y += 30
    o.append(text(P, y, t["note"], 12, MUTED))
    return svg(W, 780, o)


def buttons(lang):
    t = T[lang]
    W = 420
    o = [f'<rect x="0" y="0" width="{W}" height="48" rx="10" fill="#eef0f5"/>',
         text(16, 29, "❐ my-project", 13, MUTED),
         f'<rect x="{W - 190}" y="8" width="76" height="32" rx="8" fill="#f6f7fa"/>',
         text(W - 152, 29, "◷ 47m", 14, INK, 400, "middle"),
         f'<rect x="{W - 104}" y="8" width="92" height="32" rx="8" fill="#f6f7fa"/>',
         text(W - 58, 29, "▮▮▯ 38%", 14, INK, 400, "middle")]
    return svg(W, 48, o)


def guanguan(lang):
    t = T[lang]
    W = 560
    walk = WALK.replace("<svg", '<svg x="16" y="12" width="26" height="29"', 1)
    o = [f'<rect x="0" y="0" width="{W}" height="54" fill="{BG}"/>', walk,
         f'<text x="52" y="32" font-family="{FONT}" font-size="14" fill="{MUTED}">{html.escape(t["working"])}'
         f'<tspan dx="10">{html.escape(t["tokens"])}</tspan></text>']
    return svg(W, 54, o)


def svg(w, h, parts):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            + "".join(parts) + "</svg>\n")


OUT.mkdir(parents=True, exist_ok=True)
for lang, suffix in (("zh-Hant", "zh"), ("en", "en")):
    (OUT / f"usage-widget-{suffix}.svg").write_text(widget(lang), encoding="utf-8")
    (OUT / f"usage-buttons-{suffix}.svg").write_text(buttons(lang), encoding="utf-8")
    (OUT / f"guanguan-working-{suffix}.svg").write_text(guanguan(lang), encoding="utf-8")
print("wrote", sorted(p.name for p in OUT.iterdir()))
