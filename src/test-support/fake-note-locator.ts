import { App } from 'obsidian'
import { WorkspaceNoteLocator } from '../engine/note-binding/workspace-note-locator'
import { OpenNote } from '../engine/note-editing/open-note'
import { Attempt, Outcomes } from '../shared/models/outcome'
import { FakeEditor } from './fake-editor'

// An editor per path, so a test says which notes are open rather than stubbing
// the lookup. A path with no editor fails the way a closed tab does.
export class FakeNoteLocator extends WorkspaceNoteLocator {
  private readonly editors = new Map<string, FakeEditor>()
  private readonly closed = new Map<string, FakeEditor>()
  private saveFn: ((path: string, content: string) => void) | null = null

  constructor() {
    super({} as App)
  }

  withOpenNote(path: string, editor: FakeEditor): this {
    this.editors.set(path, editor)
    return this
  }

  // A note that exists in the vault but has no editor until something opens it,
  // which is what a search-found note is before open_note runs.
  withClosedNote(path: string, editor: FakeEditor): this {
    this.closed.set(path, editor)
    return this
  }

  // What a NoteOpener does to this locator: the editor appears.
  opens(path: string): boolean {
    const editor = this.closed.get(path)
    if (!editor) return false
    this.editors.set(path, editor)
    return true
  }

  closeNote(path: string): this {
    this.editors.delete(path)
    return this
  }

  openNotes(): ReadonlyMap<string, FakeEditor> {
    return this.editors
  }

  // A real save writes the editor's text to the file. FakeVault supplies the
  // writer rather than being held here, so the fakes keep pointing one way.
  savesWith(saveFn: (path: string, content: string) => void): this {
    this.saveFn = saveFn
    return this
  }

  async saveOpenNote(path: string): Promise<void> {
    const editor = this.editors.get(path)
    if (editor) this.saveFn?.(path, editor.getValue())
  }

  locate(path: string): Attempt<OpenNote> {
    const editor = this.editors.get(path)
    if (!editor) return Outcomes.failure('apply', `${path} is not open in an editor`)
    return Outcomes.success(new OpenNote(editor.asEditor(), path, editor.getCursor()))
  }
}
