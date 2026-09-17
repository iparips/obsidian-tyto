import { AllowedObsidianCommand } from '../../../commands/models/allowed-obsidian-command'

// The Obsidian commands this vault allows, and how to run one.
export class CommandSection {
  // Omitted entirely when the catalogue is empty, so a vault allowing no
  // commands produces the release 3 prompt byte for byte (NFR8).
  static build(commands: readonly AllowedObsidianCommand[]): string[] {
    if (commands.length === 0) return []
    return [[CommandSection.rules(), ...CommandSection.lines(commands)].join('\n')]
  }

  // Advisory, never the enforcement: the allow-list is what makes a command
  // unreachable, and this only narrows a list a pattern widened (NFR3).
  private static rules(): string {
    return [
      'You can run the Obsidian commands below, and no others. Run one when the user names a',
      'destination it opens, then edit the note it opened.',
      'Each line is "id - name". Pass the id alone to run_command: the name after the dash',
      'is there for you to read and is not part of the id.',
      'Decline a command whose effect you cannot determine from its name. Say which command',
      'you declined and why, and run nothing instead.',
      'When an utterance names a destination, prefer a listed command that opens it.',
      'First check the note you are already editing: when it is the destination, edit it and',
      'run no command. A command that opens a different day is not the way to reach today.',
      'A command only opens the note. When a skill above matches the utterance, load it',
      'first and let its steps say what to do once the note is open.',
      'Search for the note only when no listed command reaches it, then open what you found.',
    ].join('\n')
  }

  // The id first and the name after, since the id is what run_command takes.
  private static lines(commands: readonly AllowedObsidianCommand[]): string[] {
    return commands.map((command) => `${command.id} - ${command.name}`)
  }
}
