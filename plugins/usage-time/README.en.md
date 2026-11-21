# Time spent (usage-time)

[繁體中文](./README.md) · **English**

Tracks your time in Claude Code. The button above the prompt box, `[ ◷ 47m ]`, shows the minutes spent in this conversation; open it for today, each day this week, and this week by folder. **Uses no tokens**; records stay on your computer (the last 3 weeks).

## What you see

- **Today (all conversations)**: every conversation added up; time when several were open at once counts once.
- **This week, day by day**: Monday to Sunday; grey 0, light blue under 1 h, blue 1–2 h, red 2 h or more.
- **This week by folder**: the week's total, a split bar, and each folder's percentage and minutes (top three in blue, light blue and red; the rest as “Other”).

**How time is counted**: from your first message to your last; a gap of more than 30 minutes between two messages counts as being away and is left out.

With usage-meter installed, time spent is drawn in the lower half of its widget and opened with its ◷ button.

## UI language

In `/config`, set “介面語言 / UI language” to `auto` (follow the system, default), `zh-Hant` or `en`. All text is in [`hooks/strings.ts`](hooks/strings.ts).

## Install

Add the marketplace from the collection's root folder (the one with `.claude-plugin/marketplace.json`), then install. Full steps: [collection README](../../README.en.md#3-install).

```bash
claude plugin install usage-time@tcan-claude-mods
```

## Remove

```bash
claude plugin uninstall usage-time@tcan-claude-mods
```

## Modify

Colors: `PALETTE` at the top of [`hooks/register.tsx`](hooks/register.tsx). Text: [`hooks/strings.ts`](hooks/strings.ts). Tests: `claude plugin test plugins/usage-time`.
