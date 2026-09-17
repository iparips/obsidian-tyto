import { Editor, MarkdownFileInfo, TFile, Workspace } from 'obsidian'
import { FakeMarkdownLeaves } from './fake-markdown-leaves'

// Reports an active note path a test can change between calls, which is what
// makes the before-and-after diff around a command run assertable.
export class FakeWorkspace {
  private openListeners: ((file: TFile | null) => void)[] = []
  private activeEditorPath: string | null = null
  private readonly leaves = new FakeMarkdownLeaves()
  // What the test asserts NoteOpener asked the workspace to open.
  readonly opened: string[] = []

  constructor(private activePath: string | null = null) {
    if (activePath) this.leaves.open(activePath)
  }

  // The paths loadIfDeferred was called on, in order.
  get loadedLeaves(): readonly string[] {
    return this.leaves.loaded
  }

  // How many times the view under a path was flushed, which is what says a save
  // reached the leaf rather than silently finding nothing.
  savesOf(path: string): number {
    return this.leaves.savesOf(path)
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
    this.leaves.open(path)
    this.openListeners.forEach((listener) => listener({ path } as TFile))
  }

  // The mobile case the wait exists for: file-open fires, and the editor is
  // mounted some time later.
  announcesOpenWithoutEditor(path: string): void {
    this.activePath = path
    this.openListeners.forEach((listener) => listener({ path } as TFile))
  }

  mountsEditor(path: string): void {
    this.leaves.open(path)
  }

  // A tab that is open but not in front, which is the state Obsidian 1.7.2
  // added and the one no test could construct before.
  defers(path: string): this {
    this.leaves.defer(path)
    return this
  }

  // Which editor a path's leaf answers with, so a test can tell one tab's
  // editor from another's. Absent, the leaf gets an empty stand-in.
  withEditor(path: string, editor: Editor): this {
    this.leaves.setEditor(path, editor)
    return this
  }

  // What the D6 guard compares against: the note the user has in front of them.
  isLookingAt(path: string | null): this {
    this.activeEditorPath = path
    return this
  }

  get activeEditor(): MarkdownFileInfo | null {
    if (this.activeEditorPath === null) return null
    return { editor: this.leaves.editorOf(this.activeEditorPath) } as MarkdownFileInfo
  }

  getLeavesOfType(type: string): unknown[] {
    if (type !== 'markdown') return []
    return this.leaves.all()
  }

  // openFile is what NoteOpener calls: Obsidian mounts the editor and announces
  // the open, which is the pair a real open produces.
  getLeaf(_newLeaf: boolean): { openFile(file: TFile): Promise<void> } {
    return {
      openFile: (file: TFile) => {
        this.opened.push(file.path)
        this.finishesOpening(file.path)
        return Promise.resolve()
      },
    }
  }

  // The extension comes off the path, since a reader deciding whether the open
  // file is a note has only what Obsidian puts on the TFile.
  getActiveFile(): TFile | null {
    if (this.activePath === null) return null
    const path = this.activePath
    return {
      path,
      basename: '',
      extension: path.slice(path.lastIndexOf('.') + 1),
      stat: { mtime: 0 },
    } as TFile
  }
}
