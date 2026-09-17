import { App, MarkdownView, TAbstractFile, TFile } from 'obsidian'
import { OpenedNoteWait } from '../../commands/opened-note-wait'

// Opens a note the model chose, the way a command opens its own. open_note
// retargets the session, and retargeting only resolves against an editor that
// exists: a note the user has never had on screen has none, so something has to
// put it there.
export class NoteOpener {
  constructor(
    private app: App,
    private openedNoteWait: OpenedNoteWait,
  ) {}

  // True once the note is showing an editor. The wait is what makes it
  // meaningful: opening a file is asynchronous, and the editor mounts after the
  // call returns.
  async open(path: string): Promise<boolean> {
    if (this.hasEditor(path)) return true
    const file = this.app.vault.getAbstractFileByPath(path)
    if (!NoteOpener.isFile(file)) return false
    const opened = await this.openedNoteWait.forOpen(() => void this.reveal(file))
    return opened === path || this.hasEditor(path)
  }

  // Structural rather than instanceof: a note reaches here as whatever the
  // vault returned, and a folder is what this has to rule out.
  private static isFile(file: TAbstractFile | null): file is TFile {
    return file !== null && 'stat' in file
  }

  // In the active leaf, so a turn does not accumulate tabs across the notes it
  // opens. The user asked for one note to be edited, not for a split.
  private reveal(file: TFile): Promise<void> {
    return this.app.workspace.getLeaf(false).openFile(file)
  }

  // instanceof rather than a cast, so a deferred leaf reads as absent. That
  // costs one redundant open and never a stranded turn: reveal opens into the
  // active leaf, which loads the view anyway.
  private hasEditor(path: string): boolean {
    return this.app.workspace
      .getLeavesOfType('markdown')
      .map((leaf) => leaf.view)
      .filter((view): view is MarkdownView => view instanceof MarkdownView)
      .some((view) => view.file?.path === path)
  }
}
