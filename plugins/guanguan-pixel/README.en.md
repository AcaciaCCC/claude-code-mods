# CAN pixel animations (guanguan-pixel)

[繁體中文](./README.md) · **English**

CAN, the mascot of the Taiwan Climate Action Network (TCAN) — a little can with warming stripes — as pixel animations in the Claude desktop app. The animations run on your computer and **use no tokens**.

## What you see

| When | What you see |
| --- | --- |
| Claude is working | The working row shows CAN marching, with a line that changes by tool: CAN is thinking…, is running a command…, is reading…, is searching the web… |
| A tool is running | The dots become a small marching CAN, the tool's description and a line |
| First message of the day (local time) | CAN appears above the prompt box: “CAN says hi! Let's act on climate together 🌍”, 6 s |
| Claude finishes | CAN winks: “Done! ✨”, 4 s |
| Your message mentions “TCAN” (any case) | A pixel TCAN icon pops up, 8 s |
| Claude runs over 1 minute | A pixel Earth spins: “Taking a while—let the Earth spin~”, 8 s, then once a minute |

Only the **Claude desktop app** shows CAN (some mobile apps show the part above the prompt box).

## UI language

In `/config`, set “介面語言 / UI language” to `auto` (follow the system, default), `zh-Hant` or `en`. All text is in [`hooks/strings.ts`](hooks/strings.ts).

## Install

Add the marketplace from the collection's root folder (the one with `.claude-plugin/marketplace.json`), then install. Full steps: [collection README](../../README.en.md#3-install).

```bash
claude plugin install guanguan-pixel@tcan-claude-mods
```

## Remove

```bash
claude plugin uninstall guanguan-pixel@tcan-claude-mods
```

## Modify

- **Lines**: [`hooks/strings.ts`](hooks/strings.ts), Chinese and English side by side.
- **Timings and keywords**: `HELLO_MS`, `DONE_MS`, `TCAN_MS`, `LONG_MS`, `TCAN_WORDS` at the top of [`hooks/register.tsx`](hooks/register.tsx).
- **Pixel art**: drawn by the Python scripts in `tools/` (`gen2.py` CAN, `earth.py` the Earth, `logo.py` the TCAN icon). In this folder, run:

```bash
{ python3 tools/gen2.py ts; python3 tools/earth.py ts; python3 tools/logo.py ts; } > hooks/sprite.ts
```

Then type `/reload-plugins` in Claude Code.

## License

Code: MIT. CAN's design is based on the LINE sticker set 「罐罐說你好」, and the TCAN icon comes from tcan2050.org.tw; both are TCAN's brand assets, © TCAN.
