import { App, EventRef, MarkdownView, TFile } from 'obsidian'
import { ToolNoteOpening } from '../session/tool-note-opening'

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
    // Held open across the command, so the engine's own file-open handler reads
    // the event as a tool's rather than the user moving. Obsidian calls handlers
    // in registration order and the engine subscribed at load, so recording on
    // the event itself would land after it had already run.
    private toolNoteOpening: ToolNoteOpening = new ToolNoteOpening(),
  ) {}

  // The path of a note showing an editor, or nothing once the wait runs out. A
  // command that opens no note always spends the timeout, so it stays short
  // enough not to be felt.
  forOpen(run: () => void): Promise<string | null> {
    const opened = new Promise<string | null>((resolve) => this.resolveOnOpen(resolve))
    this.toolNoteOpening.openUntilSettled()
    run()
    return opened.finally(() => this.toolNoteOpening.settle())
  }

  private resolveOnOpen(resolve: (path: string | null) => void): void {
    let reference: EventRef | null = null
    let settled = false
    const timer = window.setTimeout(() => finishFn(null), this.timeoutMs)

    const finishFn = (path: string | null): void => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (reference) this.app.workspace.offref(reference)
      resolve(path)
    }

    reference = this.app.workspace.on('file-open', (file: TFile | null) =>
      this.awaitEditor(file?.path ?? null, finishFn, () => settled),
    )
  }

  // file-open announces the file, not the editor: Obsidian mounts the view
  // afterwards, so a path reported here is not yet editable. Waiting for the
  // editor is what makes the caller's resolve of that path succeed.
  private awaitEditor(
    path: string | null,
    finishFn: (path: string | null) => void,
    hasSettledFn: () => boolean,
  ): void {
    if (hasSettledFn()) return
    if (path === null) return finishFn(null)
    if (this.hasEditor(path)) return finishFn(path)
    window.setTimeout(() => this.awaitEditor(path, finishFn, hasSettledFn), EDITOR_POLL_MS)
  }

  // instanceof rather than a cast, so a deferred leaf reads as absent rather
  // than throwing on the missing file. Deliberately not a load: this is polling
  // a leaf Obsidian is mounting, and loading one would race that mount.
  private hasEditor(path: string): boolean {
    return this.app.workspace
      .getLeavesOfType('markdown')
      .map((leaf) => leaf.view)
      .filter((view): view is MarkdownView => view instanceof MarkdownView)
      .some((view) => view.file?.path === path && Boolean(view.editor))
  }
}
