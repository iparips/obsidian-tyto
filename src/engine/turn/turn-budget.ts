// One, because a turn writes to one note and the note it opens is that note.
// Counted per distinct note: returning to one already opened is not a second
// note, and a command can move the target off it without the model choosing to.
const MAX_OPENS = 1

// What a turn may open. The cost of a turn is one number, held by
// IterationBudget and visible as the numbered steps the user reads; this holds
// the one limit that is about safety rather than cost, since a turn that writes
// to several notes is a different thing from a slow one.
export class TurnBudget {
  private readonly opened = new Set<string>()

  // Asked before the user is, so a note the cap forbids is refused without a
  // pointless question. The spend is separate, because a declined open is not
  // a note opened and must not cost the turn its one.
  canOpen(path: string): boolean {
    return this.opened.has(path) || this.opened.size < MAX_OPENS
  }

  takeOpen(path: string): void {
    this.opened.add(path)
  }

  static openCapMessage(): string {
    return `this turn has already opened ${MAX_OPENS} note; edit that note rather than opening another`
  }
}
