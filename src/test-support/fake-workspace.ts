import { TFile, Workspace } from 'obsidian'

// Reports an active note path a test can change between calls, which is what
// makes the before-and-after diff around a command run assertable.
export class FakeWorkspace {
  private openListeners: ((file: TFile | null) => void)[] = []
  private editorPaths: string[] = []

  constructor(private activePath: string | null = null) {
    if (activePath) this.editorPaths.push(activePath)
  }

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

  // Announces the open, the way Obsidian does once the note is showing, with
  // the editor already mounted.
  finishesOpening(path: string): void {
    this.activePath = path
    this.editorPaths.push(path)
    this.openListeners.forEach((listener) => listener({ path } as TFile))
  }

  // The mobile case the wait exists for: file-open fires, and the editor is
  // mounted some time later.
  announcesOpenWithoutEditor(path: string): void {
    this.activePath = path
    this.openListeners.forEach((listener) => listener({ path } as TFile))
  }

  mountsEditor(path: string): void {
    this.editorPaths.push(path)
  }

  getLeavesOfType(type: string): unknown[] {
    if (type !== 'markdown') return []
    return this.editorPaths.map((path) => ({ view: { file: { path }, editor: {} } }))
  }

  getActiveFile(): TFile | null {
    if (this.activePath === null) return null
    return { path: this.activePath, basename: '', stat: { mtime: 0 } } as TFile
  }
}
