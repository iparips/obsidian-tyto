import { App, EventRef, MarkdownView, TFile } from 'obsidian'

const OPEN_TIMEOUT_MS = 1500
const EDITOR_POLL_MS = 50

// executeCommandById returns when the command starts, not when it finishes.
// Opening a note is asynchronous: the file may be created, a leaf opened and an
// editor mounted after the call returns, so reading the active file on the next
// line sees the note the user was already on. Mobile loses this race most often.
export class OpenedNoteWait {
  constructor(
    private app: App,
    private timeoutMs: number = OPEN_TIMEOUT_MS,
  ) {}

  // The path of a note showing an editor, or nothing once the wait runs out. A
  // command that opens no note always spends the timeout, so it stays short
  // enough not to be felt.
  forOpen(run: () => void): Promise<string | null> {
    const opened = new Promise<string | null>((resolve) => this.resolveOnOpen(resolve))
    run()
    return opened
  }

  private resolveOnOpen(resolve: (path: string | null) => void): void {
    let reference: EventRef | null = null
    let settled = false
    const timer = setTimeout(() => finish(null), this.timeoutMs)

    const finish = (path: string | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (reference) this.app.workspace.offref(reference)
      resolve(path)
    }

    reference = this.app.workspace.on('file-open', (file: TFile | null) =>
      this.awaitEditor(file?.path ?? null, finish, () => settled),
    )
  }

  // file-open announces the file, not the editor: Obsidian mounts the view
  // afterwards, so a path reported here is not yet editable. Waiting for the
  // editor is what makes the caller's resolve of that path succeed.
  private awaitEditor(
    path: string | null,
    finish: (path: string | null) => void,
    hasSettled: () => boolean,
  ): void {
    if (hasSettled()) return
    if (path === null) return finish(null)
    if (this.hasEditor(path)) return finish(path)
    setTimeout(() => this.awaitEditor(path, finish, hasSettled), EDITOR_POLL_MS)
  }

  private hasEditor(path: string): boolean {
    return this.app.workspace
      .getLeavesOfType('markdown')
      .map((leaf) => leaf.view as MarkdownView)
      .some((view) => view.file?.path === path && Boolean(view.editor))
  }
}
