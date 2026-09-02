export const LOAD_SKILL = 'load_skill'

// One tool call the model asked for. It classifies itself, so callers dispatch
// on a method rather than comparing the raw name at each site.
export class ToolCall {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly args: Record<string, unknown>,
  ) {}

  isLoadSkill(): boolean {
    return this.name === LOAD_SKILL
  }

  argument(key: string): string {
    const value = this.args[key]
    return typeof value === 'string' ? value : String(value)
  }
}
