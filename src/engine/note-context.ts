// The note as it stands at the start of one turn. Re-read from the editor each
// turn, so it is a snapshot rather than a live view.
export class NoteContext {
  constructor(
    readonly path: string,
    readonly content: string,
    readonly cursorLine: number,
  ) {}
}
