// Which note a command opened, which is all a run changes as far as the harness
// can tell: a command's other effects are unobservable here, and the bound note
// is the only question the next tool call depends on. Null when it opened none.
export class NoteOpenedByObsidianCommand {
  private constructor(
    readonly commandName: string,
    readonly openedPath: string | null,
  ) {}

  static opened(commandName: string, path: string): NoteOpenedByObsidianCommand {
    return new NoteOpenedByObsidianCommand(commandName, path)
  }

  static openedNothing(commandName: string): NoteOpenedByObsidianCommand {
    return new NoteOpenedByObsidianCommand(commandName, null)
  }

  rebinds(): boolean {
    return this.openedPath !== null
  }

  // States the binding move in words, because a silent rebind leaves the next
  // anchor pointing at the wrong note. Whether the opened note is editable is
  // the caller's to observe: only it resolves the path against the workspace.
  descriptionForModel(openedNoteIsEditable: boolean): string {
    if (!openedNoteIsEditable) {
      return `ran ${this.commandName}; ${this.openedPath} opened but is not editable yet, so no edit was made`
    }
    return this.openedPath
      ? `ran ${this.commandName}; the session is now editing ${this.openedPath}`
      : `ran ${this.commandName}; no note opened, still editing the same note`
  }

  // Distinct from opening nothing: the note is the target, so a retry reaches
  // it, but no editor is showing it yet and an edit now would fail.
  // What the steps list shows: the command, and the note if it moved the
  // binding. Shorter than what the model reads, which has to spell out that the
  // target moved.
  descriptionForUser(): string {
    if (!this.openedPath) return this.commandName
    return `${this.commandName} — now editing ${this.openedPath}`
  }
}
