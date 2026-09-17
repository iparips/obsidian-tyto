import { App, Editor, MarkdownView, WorkspaceLeaf } from 'obsidian'
import { OpenNote } from '../note-editing/open-note'
import { Attempt, Outcomes } from '../../shared/models/outcome'

// A lookup, holding no binding of its own: the caller says which note, this
// finds the editor showing it, or says that none does.
export class WorkspaceNoteLocator {
  constructor(private app: App) {}

  // A note with no leaf still resolves, carrying a null editor: the write goes
  // through the vault. Only a path no editor could ever show fails, and it
  // fails before the search, so a session bound to a canvas costs no loads.
  async locate(path: string): Promise<Attempt<OpenNote>> {
    if (!path.endsWith('.md')) return Outcomes.failure('apply', WorkspaceNoteLocator.notANote(path))
    const editor = await this.findEditor(path)
    if (!editor) return Outcomes.success(new OpenNote(null, path, { line: 0, ch: 0 }))
    return Outcomes.success(new OpenNote(editor, path, editor.getCursor()))
  }

  // TextFileView saves two seconds after a change, so an editor this plugin
  // just wrote through disagrees with its file until then. A caller comparing
  // the two flushes first, or reads a file missing its own last edit.
  async saveOpenNote(path: string): Promise<void> {
    await (await this.findView(path))?.save()
  }

  // A path that is not a note can never gain an editor, so the message says to
  // start again rather than to open it: a session bound to a canvas, a PDF or a
  // Bases file is stuck until it is reset. Vault-writing one would rewrite its
  // JSON as markdown, which is worse than refusing the turn.
  private static notANote(path: string): string {
    return `${path} is not a markdown note, so it cannot be edited; press Reset to start a session on a note`
  }

  private async findEditor(path: string): Promise<Editor | null> {
    return (await this.findView(path))?.editor ?? null
  }

  // Loaded leaves first, so the tab the user is looking at answers without
  // loading anything. Obsidian's guide asks that deferred views be loaded
  // sparingly, and ordering the search is what keeps that promise.
  private async findView(path: string): Promise<MarkdownView | null> {
    const leaves = this.app.workspace.getLeavesOfType('markdown')
    const loaded = leaves.filter((leaf) => !leaf.isDeferred)
    return (
      WorkspaceNoteLocator.viewShowing(path, loaded) ??
      (await this.loadUntilShowing(
        path,
        leaves.filter((leaf) => leaf.isDeferred),
      ))
    )
  }

  // One leaf at a time, stopping at the first match, so a workspace of
  // background tabs costs only the loads it takes to reach the target.
  private async loadUntilShowing(
    path: string,
    deferred: WorkspaceLeaf[],
  ): Promise<MarkdownView | null> {
    for (const leaf of deferred) {
      await leaf.loadIfDeferred()
      // Re-read after the load: a deferred leaf's view is a stand-in, and the
      // load replaces it rather than filling it in.
      const view = WorkspaceNoteLocator.viewShowing(path, [leaf])
      if (view) {
        console.debug(`[tyto] loaded deferred leaf for ${path}`)
        return view
      }
    }
    console.debug(`[tyto] no leaf holds ${path}`)
    return null
  }

  // instanceof rather than a cast, which is what the deferred-view guide
  // requires: a leaf that loads into something else is skipped, not trusted.
  private static viewShowing(path: string, leaves: WorkspaceLeaf[]): MarkdownView | null {
    const match = leaves
      .map((leaf) => leaf.view)
      .filter((view): view is MarkdownView => view instanceof MarkdownView)
      .find((view) => view.file?.path === path)
    return match ?? null
  }
}
