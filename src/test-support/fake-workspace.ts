import { TFile, Workspace } from 'obsidian'

// Reports an active note path a test can change between calls, which is what
// makes the before-and-after diff around a command run assertable.
export class FakeWorkspace {
  constructor(private activePath: string | null = null) {}

  asWorkspace(): Workspace {
    return this as unknown as Workspace
  }

  opens(path: string | null): void {
    this.activePath = path
  }

  getActiveFile(): TFile | null {
    if (this.activePath === null) return null
    return { path: this.activePath, basename: '', stat: { mtime: 0 } } as TFile
  }
}
