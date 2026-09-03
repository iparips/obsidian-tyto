import { App, Editor, MarkdownView } from 'obsidian'
import { OpenNote } from './models/open-note'
import { Attempt, Outcomes } from '../shared/models/outcome'

// A lookup, holding no binding of its own: the caller says which note, this
// finds the editor showing it.
export class WorkspaceNoteLocator {
  constructor(private app: App) {}

  locate(path: string): Attempt<OpenNote> {
    const editor = this.findEditor(path)
    if (!editor) return Outcomes.failure('apply', WorkspaceNoteLocator.notOpenMessage(path))
    return Outcomes.success(new OpenNote(editor, path, editor.getCursor()))
  }

  // A path that is not a note can never gain an editor, so the message says to
  // start again rather than to open it: a session bound to a canvas, a PDF or a
  // Bases file is stuck until it is reset.
  private static notOpenMessage(path: string): string {
    if (path.endsWith('.md')) return `${path} is not open in an editor`
    return `${path} is not a markdown note, so it cannot be edited; press Reset to start a session on a note`
  }

  private findEditor(path: string): Editor | null {
    const leaves = this.app.workspace.getLeavesOfType('markdown')
    const match = leaves
      .map((leaf) => leaf.view as MarkdownView)
      .find((view) => view.file?.path === path)
    return match?.editor ?? null
  }
}
