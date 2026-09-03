import { App, Workspace } from 'obsidian'
import { CommandCatalogue } from './command-catalogue'
import { OpenedNoteWait } from './opened-note-wait'
import { CommandEffect } from './models/command-effect'
import { Outcome, Outcomes } from '../shared/models/outcome'

// Records the active note, runs the command, reads the active note again. The
// difference is the whole report: a command's other effects are unbounded and
// unobservable, and the binding is the only one the next tool call depends on.
export class CommandRunner {
  constructor(
    private app: App,
    private catalogue: CommandCatalogue,
    private openedNoteWait: OpenedNoteWait,
  ) {}

  async run(commandId: string): Promise<Outcome<CommandEffect>> {
    const allowed = this.catalogue.resolve().find((command) => command.id === commandId)
    if (!allowed)
      return Outcomes.failure('apply', `${commandId} is not an allowed command in this vault`)
    return Outcomes.success(await this.runAllowed(commandId, allowed.name))
  }

  // The wait is what makes the after-read meaningful: without it the active
  // file is still the one the user was on when a command opens a note.
  private async runAllowed(commandId: string, commandName: string): Promise<CommandEffect> {
    const before = this.activePath()
    const opened = await this.openedNoteWait.forOpen(() =>
      this.app.commands.executeCommandById(commandId),
    )
    return CommandRunner.effectOf(commandName, before, opened ?? this.activePath())
  }

  // Reopening the already-bound note counts as opening nothing, since the
  // binding does not move.
  private static effectOf(
    commandName: string,
    before: string | null,
    after: string | null,
  ): CommandEffect {
    if (after === null || after === before) return CommandEffect.openedNothing(commandName)
    return CommandEffect.opened(commandName, after)
  }

  private activePath(): string | null {
    const workspace = this.app.workspace as Workspace
    return workspace.getActiveFile()?.path ?? null
  }
}
