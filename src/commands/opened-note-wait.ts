import { App, EventRef, TFile } from 'obsidian'

const OPEN_TIMEOUT_MS = 1500

// executeCommandById returns when the command starts, not when it finishes.
// Opening a note is asynchronous: the file may be created, a leaf opened and an
// editor mounted after the call returns, so reading the active file on the next
// line sees the note the user was already on. Mobile loses this race most often.
export class OpenedNoteWait {
  constructor(
    private app: App,
    private timeoutMs: number = OPEN_TIMEOUT_MS,
  ) {}

  // The path the first file-open reports, or nothing once the wait runs out. A
  // command that opens no note always spends the timeout, so it stays short
  // enough not to be felt.
  forOpen(run: () => void): Promise<string | null> {
    const opened = new Promise<string | null>((resolve) => this.resolveOnOpen(resolve))
    run()
    return opened
  }

  private resolveOnOpen(resolve: (path: string | null) => void): void {
    let reference: EventRef | null = null
    const timer = setTimeout(() => finish(null), this.timeoutMs)

    const finish = (path: string | null): void => {
      clearTimeout(timer)
      if (reference) this.app.workspace.offref(reference)
      resolve(path)
    }

    reference = this.app.workspace.on('file-open', (file: TFile | null) =>
      finish(file?.path ?? null),
    )
  }
}
