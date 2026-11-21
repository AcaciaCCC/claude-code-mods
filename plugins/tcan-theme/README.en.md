# TCAN theme (tcan-theme)

[繁體中文](./README.md) · **English**

Recolors the Claude desktop app in Taiwan Climate Action Network (TCAN) colors: TCAN blue `#1D5BD0`, navy `#000066`, sky blue `#1B87B0` and warming red `#E04A56`. Light mode only; code and Git colors follow the same palette. There's no text, so there's no language setting.

## What changes

- Buttons, links, toggles, selection, focus rings: TCAN blue
- Errors and deletions: warming red
- Sidebar: pale TCAN blue; conversation: blue-tinted off-white; panels: white
- Code: `github-light` highlighting, or TCAN-derived colors where the app doesn't offer it
- Git: additions blue, removals red, modifications sky blue, merges navy

Only the **Claude desktop and mobile apps** draw themes. Claude Code in a terminal or editor isn't recolored, and a theme can't change fonts or layout.

## Install

Add the marketplace from the collection's root folder (the one with `.claude-plugin/marketplace.json`), then install. Full steps: [collection README](../../README.en.md#3-install).

```bash
claude plugin install tcan-theme@tcan-claude-mods
```

## Remove

```bash
claude plugin uninstall tcan-theme@tcan-claude-mods
```

## Change the colors

All colors are in [`hooks/register.ts`](hooks/register.ts). Type `/reload-plugins` in Claude Code afterwards.

## License

Code: MIT. The palette is TCAN's brand identity (from tcan2050.org.tw).
