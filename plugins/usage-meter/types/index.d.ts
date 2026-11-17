export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Day = {
  active: number
  work: number
  /** This day's time per folder (last path part), ms; '' for spans recorded before folders were kept. */
  folders?: Record<string, number>
}

declare module 'claude-code' {
  interface PluginState {
    'usage-meter': {
      limits: Limit[]
      /** The quota section is shown (its button reads 收起). */
      showUsage: boolean
      /** The usage-time section is shown (only with usage-time installed). */
      showTime: boolean
      /** Session start, for the time button and the time section. */
      sessionStart: number
      /** Bumped every minute so the time figures refresh. */
      tick: number
      /** Per day (YYYY-MM-DD), how many points of the 7-day quota were used; drawn as the calendar. */
      dailyWeekUse: Record<string, number>
    }
    /** Read only: the usage-time mod's own values, drawn in the lower section. */
    'usage-time': {
      workMs: number
      days: Record<string, Day>
      sessionMs: number
    }
  }
}
