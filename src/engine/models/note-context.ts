import { EditorPosition } from 'obsidian'

// The note as it stands at the start of one model iteration. Re-read from the
// editor each time, so it is a snapshot rather than a live view.
export class NoteContext {
  constructor(
    readonly path: string,
    readonly content: string,
    readonly cursor: EditorPosition,
  ) {}
}
