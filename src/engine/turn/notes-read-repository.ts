// The notes read this turn, held for the turn rather than the session. Per
// turn, because the note can change between turns: a read in an earlier one is
// no evidence about the note a whole-note write is about to replace.
export class NotesReadRepository {
  private readonly contents = new Map<string, string>()

  includes(path: string): boolean {
    return this.contents.has(path)
  }

  // The latest read wins, since a re-read is what a stale write is told to do.
  record(path: string, contents: string): void {
    this.contents.set(path, contents)
  }

  getContentsRead(path: string): string {
    return this.contents.get(path) ?? ''
  }
}
