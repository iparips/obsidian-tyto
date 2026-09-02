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
}
