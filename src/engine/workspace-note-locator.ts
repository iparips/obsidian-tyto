import { App, Editor, MarkdownView, TFile } from 'obsidian'
import { OpenNote } from './models/open-note'
import { Outcome, Outcomes } from '../shared/models/outcome'

export class WorkspaceNoteLocator {
  constructor(
    private app: App,
    private file: TFile,
  ) {}

  locate(): Outcome<OpenNote> {
    const editor = this.findEditor()
    if (!editor) return Outcomes.failure('apply', 'the session note is not open in an editor')
    return Outcomes.success(this.openNote(editor))
  }

  private openNote(editor: Editor): OpenNote {
    return new OpenNote(editor, this.file.path, editor.getCursor())
  }

  private findEditor(): Editor | null {
    const leaves = this.app.workspace.getLeavesOfType('markdown')
    const match = leaves
      .map((leaf) => leaf.view as MarkdownView)
      .find((view) => view.file?.path === this.file.path)
    return match?.editor ?? null
  }
}
