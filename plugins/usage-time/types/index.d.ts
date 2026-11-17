/** One day's totals, in milliseconds, kept across sessions in $.store under "days". */
export type Day = {
  active: number
  work: number
  /** This day's time per folder (last path part), ms; '' for spans recorded before folders were kept. */
  folders?: Record<string, number>
}

declare module 'claude-code' {
  interface PluginState {
    'usage-time': {
      /** Session start, in $.clock.now() milliseconds. */
      startedAt: number
      /** Claude's working time this session (main-thread turns), in ms; usage-meter reads this too. */
      workMs: number
      /** Day/week totals (also kept in $.store), for drawing; usage-meter reads this too. */
      days: Record<string, Day>
      /** Bumped every minute so the drawings refresh. */
      tick: number
      /** Its own widget is open (alone, without usage-meter). */
      isOpen: boolean
      /** This conversation: first message to last message, gaps over 30 min left out (ms); usage-meter reads this too. */
      sessionMs: number
      /** When the last message was sent (0 before the first). */
      lastSubmitAt: number
    }
  }
}

