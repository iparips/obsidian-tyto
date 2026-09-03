export const LOAD_SKILL = 'load_skill'
export const RUN_COMMAND = 'run_command'
export const SEARCH_VAULT = 'search_vault'
export const READ_NOTE = 'read_note'
export const ANSWER_FROM_SEARCH = 'answer_from_search'
export const OPEN_NOTE = 'open_note'
export const ASK_USER = 'ask_user'

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

  isRunCommand(): boolean {
    return this.name === RUN_COMMAND
  }

  isSearchVault(): boolean {
    return this.name === SEARCH_VAULT
  }

  isReadNote(): boolean {
    return this.name === READ_NOTE
  }

  isAnswerFromSearch(): boolean {
    return this.name === ANSWER_FROM_SEARCH
  }

  isOpenNote(): boolean {
    return this.name === OPEN_NOTE
  }

  isAskUser(): boolean {
    return this.name === ASK_USER
  }

  isHarnessTool(): boolean {
    return (
      this.isRunCommand() ||
      this.isSearchVault() ||
      this.isReadNote() ||
      this.isAnswerFromSearch() ||
      this.isOpenNote() ||
      this.isAskUser()
    )
  }

  argument(key: string): string {
    const value = this.args[key]
    return typeof value === 'string' ? value : String(value)
  }

  numberArgument(key: string): number | undefined {
    const value = this.args[key]
    return typeof value === 'number' ? value : undefined
  }

  stringsArgument(key: string): string[] {
    const value = this.args[key]
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
}
