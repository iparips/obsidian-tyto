// The notes the user chose to open, held for the turn rather than the session.
// Per turn, because consent is about the write in front of the user: a session
// scope would let one pick license every later edit to that note.
export class ChosenNotes {
  private readonly paths = new Set<string>()

  // Per path rather than one flag, so a turn that offers a second, different
  // note asks again and one pick licenses one note.
  includes(path: string): boolean {
    return this.paths.has(path)
  }

  record(path: string): void {
    this.paths.add(path)
  }
}
