// What a run changed, as far as the harness can tell: the bound note before and
// after is the only question the next tool call depends on.
export class CommandEffect {
  private constructor(
    readonly commandName: string,
    readonly openedPath: string | null,
  ) {}

  static opened(commandName: string, path: string): CommandEffect {
    return new CommandEffect(commandName, path)
  }

  static openedNothing(commandName: string): CommandEffect {
    return new CommandEffect(commandName, null)
  }

  rebinds(): boolean {
    return this.openedPath !== null
  }

  // States the binding move in words, because a silent rebind leaves the next
  // anchor pointing at the wrong note.
  describe(): string {
    return this.openedPath
      ? `ran ${this.commandName}; the session is now editing ${this.openedPath}`
      : `ran ${this.commandName}; no note opened, still editing the same note`
  }

  // What the steps list shows: the command, and the note if it moved the
  // binding. Shorter than describe(), which is written for the model and has to
  // spell out that the target moved.
  stepDetail(): string {
    if (!this.openedPath) return this.commandName
    return `${this.commandName} — now editing ${this.openedPath}`
  }

  // Distinct from opening nothing: the note is the target, so a retry reaches
  // it, but no editor is showing it yet and an edit now would fail.
  describeUneditable(): string {
    return `ran ${this.commandName}; ${this.openedPath} opened but is not editable yet, so no edit was made`
  }
}
