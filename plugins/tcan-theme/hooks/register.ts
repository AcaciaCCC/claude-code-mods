import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// TCAN for Claude: a TCAN-blue sidebar (surface-0) beside the 0.2.0 conversation colours.
// Values from the "TCAN for Claude" design system (tcan2050.org.tw palette). Light mode only.
export const { theme, problems } = makeColors({
  label: 'TCAN',
  only: 'light',
  roles: {
    accent: '#1d5bd0', // tcan-blue
    danger: '#e04a56', // tcan-red
    success: '#2e8b6a',
    warning: '#c98a12',
    pro: '#000066', // tcan-navy
  },
  // Blue / navy / red highlighting, the closest named theme to TCAN's palette.
  // A surface that does not offer it keeps the TCAN-derived colors above.
  codeTheme: { light: 'github-light' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e6edf8', // sidebar: pale TCAN blue
        'surface-1': '#f8f9fc', // conversation, as in 0.2.0
        'surface-2': '#ffffff', // panels
        'text-primary': '#0a0f2c',
        'text-secondary': '#353b58',
        'text-muted': '#555a70',
      },
    },
    git: {
      added: '#1d5bd0', // tcan-blue
      removed: '#c22f3c', // tcan-red, deepened (design system 'danger')
      modified: '#1b87b0', // tcan-sky, deepened to read on white
      merged: '#000066', // tcan-navy
      closed: '#555555', // site gray
      conflicting: '#9a6200', // design system 'warn'
      draft: '#636363',
    },
  },
})

const LOOK: ThemeSetArgs = { colors: theme, overrideColorScheme: 'light' }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    return next(e)
  })

}
