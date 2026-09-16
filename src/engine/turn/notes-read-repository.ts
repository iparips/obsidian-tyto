// The notes read this turn, held for the turn rather than the session. Per
// turn, because the note can change between turns: a read in an earlier one is
// no evidence about the note a whole-note write is about to replace.
export class NotesReadRepository {
  private readonly paths = new Set<string>()

  includes(path: string): boolean {
    return this.paths.has(path)
  }

  record(path: string): void {
    this.paths.add(path)
  }
}
