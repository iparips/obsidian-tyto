export const LOAD_SKILL = 'load_skill'
export const NO_SKILL_APPLIES = 'no_skill_applies'
export const RUN_COMMAND = 'run_command'
export const GLOB_NOTES = 'glob_notes'
export const GREP_NOTES = 'grep_notes'
export const READ_NOTE = 'read_note'
export const ANSWER_FROM_SEARCH = 'answer_from_search'
export const OPEN_NOTE = 'open_note'
export const CHOOSE_NOTE = 'choose_note'
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

  isNoSkillApplies(): boolean {
    return this.name === NO_SKILL_APPLIES
  }

  isRunCommand(): boolean {
    return this.name === RUN_COMMAND
  }

  isGlobNotes(): boolean {
    return this.name === GLOB_NOTES
  }

  isGrepNotes(): boolean {
    return this.name === GREP_NOTES
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

  isChooseNote(): boolean {
    return this.name === CHOOSE_NOTE
  }

  isAskUser(): boolean {
    return this.name === ASK_USER
  }

  isHarnessTool(): boolean {
    return (
      this.isRunCommand() ||
      this.isGlobNotes() ||
      this.isGrepNotes() ||
      this.isReadNote() ||
      this.isAnswerFromSearch() ||
      this.isOpenNote() ||
      this.isChooseNote() ||
      this.isAskUser()
    )
  }

  argument(key: string): string {
    const value = this.args[key]
    return typeof value === 'string' ? value : String(value)
  }

  // Absent rather than the string "undefined", so an optional argument the
  // model omitted reads as omitted at the call site.
  optionalArgument(key: string): string | undefined {
    const value = this.args[key]
    return typeof value === 'string' ? value : undefined
  }

  booleanArgument(key: string): boolean {
    return this.args[key] === true
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
