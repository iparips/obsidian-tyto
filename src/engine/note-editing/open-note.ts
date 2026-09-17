import { Editor, EditorPosition } from 'obsidian'

// The bound note for one turn: the editor to write through, and the cursor as
// it was when the utterance arrived. Holds no service.
export class OpenNote {
  constructor(
    readonly editor: Editor,
    readonly path: string,
    readonly cursorAtStart: EditorPosition,
  ) {}
}
