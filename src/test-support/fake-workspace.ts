import { TFile, Workspace } from 'obsidian'

// Reports an active note path a test can change between calls, which is what
// makes the before-and-after diff around a command run assertable.
export class FakeWorkspace {
  private openListeners: ((file: TFile | null) => void)[] = []

  constructor(private activePath: string | null = null) {}

  // Obsidian fires file-open once a note is actually showing, which is what a
  // command's after-read has to wait for.
  on(name: string, callback: (file: TFile | null) => void): unknown {
    if (name === 'file-open') this.openListeners.push(callback)
    return callback
  }

  offref(reference: unknown): void {
    this.openListeners = this.openListeners.filter((listener) => listener !== reference)
  }

  asWorkspace(): Workspace {
    return this as unknown as Workspace
  }

  // Sets the active file without announcing it, as a command that opens nothing
  // leaves the workspace.
  opens(path: string | null): void {
    this.activePath = path
  }

  // Announces the open, the way Obsidian does once the note is showing.
  finishesOpening(path: string): void {
    this.activePath = path
    this.openListeners.forEach((listener) => listener({ path } as TFile))
  }

  getActiveFile(): TFile | null {
    if (this.activePath === null) return null
    return { path: this.activePath, basename: '', stat: { mtime: 0 } } as TFile
  }
}
