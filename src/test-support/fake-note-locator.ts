import { App } from 'obsidian'
import { WorkspaceNoteLocator } from '../engine/workspace-note-locator'
import { OpenNote } from '../engine/models/open-note'
import { Attempt, Outcomes } from '../shared/models/outcome'
import { FakeEditor } from './fake-editor'

// An editor per path, so a test says which notes are open rather than stubbing
// the lookup. A path with no editor fails the way a closed tab does.
export class FakeNoteLocator extends WorkspaceNoteLocator {
  private readonly editors = new Map<string, FakeEditor>()

  constructor() {
    super({} as App)
  }

  withOpenNote(path: string, editor: FakeEditor): this {
    this.editors.set(path, editor)
    return this
  }

  closeNote(path: string): this {
    this.editors.delete(path)
    return this
  }

  locate(path: string): Attempt<OpenNote> {
    const editor = this.editors.get(path)
    if (!editor) return Outcomes.failure('apply', `${path} is not open in an editor`)
    return Outcomes.success(new OpenNote(editor.asEditor(), path, editor.getCursor()))
  }
}
