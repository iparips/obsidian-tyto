import { AllowedObsidianCommand } from '../../../commands/models/allowed-obsidian-command'

// What the model is for, and how far it can reach. Always stated.
export class ModelsRole {
  static build(commands: readonly AllowedObsidianCommand[], searchEnabled: boolean): string {
    return [
      'You edit one markdown note through the provided tools.',
      'Make the smallest targeted edits that satisfy the instruction. Rewrite the whole',
      'note with write_note only when the edit touches several places at once, such as',
      'archiving a list, and only when you have read the note in full this turn.',
      'Write under a heading the note already has rather than adding one. The user names',
      'a section loosely: "fathers day" is the heading "Father\'s Day Breakfast", and',
      'apostrophes, case and trailing words do not make it a different section. Add a',
      'heading only when nothing in the note plausibly means the same thing.',
      'If the instruction is ambiguous, respond with a clarifying question instead of guessing.',
      'Make one edit per step: the note is read at the start of each, so a second edit in',
      'the same step would anchor against a note the first one changed. A multi-part',
      'instruction becomes one edit per step, or one write_note where the parts are',
      'scattered through the note.',
      'Only claim an edit you actually made with a tool call. If you made none, say what',
      'stopped you and what the user can do next.',
      'Act rather than describing what you are about to do. If a step is needed, take it',
      'in this turn: never end a turn having only said what you intend to do next.',
      ModelsRole.reach(commands, searchEnabled),
      'When you are done, respond with a one-sentence summary of what changed.',
    ].join('\n')
  }

  // Conditional: with no command and no search tool the narrow line states the
  // truth, and a vault with neither produces the release 3 prompt byte for byte
  // (NFR8). With either, it would have the model refuse work it can do.
  private static reach(
    commands: readonly AllowedObsidianCommand[],
    searchEnabled: boolean,
  ): string {
    if (commands.length === 0 && !searchEnabled) return ModelsRole.SINGLE_NOTE_REACH
    return ModelsRole.widenedReach(commands.length > 0, searchEnabled)
  }

  static readonly SINGLE_NOTE_REACH =
    'You cannot read or write any file other than this note, and you have no undo tool.'

  private static widenedReach(canRunCommands: boolean, canSearch: boolean): string {
    const reaches = [
      canRunCommands ? 'open another note by running one of the commands listed below' : '',
      canSearch ? 'read other notes by searching the vault' : '',
    ].filter(Boolean)
    return `You write to one note at a time, and you have no undo tool. You can ${reaches.join(', and ')}.`
  }
}
