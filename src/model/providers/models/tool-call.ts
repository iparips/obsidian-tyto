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
export const RESOLVE_DATE = 'resolve_date'

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

  isRecordNoSkillApplies(): boolean {
    return this.name === NO_SKILL_APPLIES
  }

  isRunObsidianCommand(): boolean {
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

  isResolveDate(): boolean {
    return this.name === RESOLVE_DATE
  }

  // The tools that reach the vault or the command registry. Asking and
  // answering are dispatched before this, since neither touches either.
  // resolve_date reaches neither, but it is refused with the search tools when
  // search is off, so it routes with them rather than being a second exception.
  isHarnessTool(): boolean {
    return (
      this.isRunObsidianCommand() ||
      this.isGlobNotes() ||
      this.isGrepNotes() ||
      this.isReadNote() ||
      this.isOpenNote() ||
      this.isChooseNote() ||
      this.isResolveDate()
    )
  }

  // The calls that can be the first thing a turn does to the vault, which is
  // where the skill question has to be settled: a skill knows where its notes
  // live and how they are named. choose_note and open_note are absent because
  // one of these produced the path they take, so the gate has already held
  // there; resolve_date because it reaches no vault, and reading the user's own
  // words is what tells the model which skill the turn needs.
  opensVaultAccess(): boolean {
    return (
      this.isRunObsidianCommand() || this.isGlobNotes() || this.isGrepNotes() || this.isReadNote()
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
