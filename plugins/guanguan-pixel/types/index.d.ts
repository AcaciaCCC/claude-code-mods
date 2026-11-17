/** 罐罐正在用的工具名稱（Bash、Read…），沒在用時為 null */
export type CurrentTool = string | null

/** 輸入框上方此刻要演的場景：每日招呼、做完事、提到 TCAN、跑超過一分鐘，或沒有 */
export type Scene = 'hello' | 'done' | 'tcan' | 'earth' | null

declare module 'claude-code' {
  interface PluginState {
    'guanguan-pixel': { tool: CurrentTool; scene: Scene }
  }
}
