import { Editor, EditorPosition } from 'obsidian'

// The bound note for one turn: the editor to write through, and the cursor as
// it was when the utterance arrived. Holds no service.
//
// A null editor is a note with no leaf anywhere. It is still the turn's target:
// the write goes through the vault, which costs undo and nothing else, where
// refusing the turn cost the user the session.
export class OpenNote {
  constructor(
    readonly editor: Editor | null,
    readonly path: string,
    readonly cursorAtStart: EditorPosition,
  ) {}

  // Narrows rather than returning a plain boolean, so a caller past the guard
  // reaches the editor without a cast.
  hasEditor(): this is OpenNote & { editor: Editor } {
    return this.editor !== null
  }
}
