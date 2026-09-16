// Whether a tool is opening a note right now, so the file-open Obsidian fires
// for one is not read as the user moving. A window rather than a set of paths:
// Obsidian calls handlers in registration order and the engine subscribed at
// load, so a path recorded on the event lands after the engine has read it.
export class ToolNoteOpening {
  private open = 0

  isOpening(): boolean {
    return this.open > 0
  }

  // Counted rather than a flag, so two commands in one turn do not close the
  // window on each other.
  openUntilSettled(): void {
    this.open += 1
  }

  settle(): void {
    this.open = Math.max(0, this.open - 1)
  }
}
