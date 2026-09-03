import { App, Editor, MarkdownView } from 'obsidian'
import { OpenNote } from './models/open-note'
import { Attempt, Outcomes } from '../shared/models/outcome'

// A lookup, holding no binding of its own: the caller says which note, this
// finds the editor showing it.
export class WorkspaceNoteLocator {
  constructor(private app: App) {}

  locate(path: string): Attempt<OpenNote> {
    const editor = this.findEditor(path)
    if (!editor) return Outcomes.failure('apply', `${path} is not open in an editor`)
    return Outcomes.success(new OpenNote(editor, path, editor.getCursor()))
  }

  private findEditor(path: string): Editor | null {
    const leaves = this.app.workspace.getLeavesOfType('markdown')
    const match = leaves
      .map((leaf) => leaf.view as MarkdownView)
      .find((view) => view.file?.path === path)
    return match?.editor ?? null
  }
}
