import { Editor } from 'obsidian'
import { FakeEditor } from './fake-editor'
import { FakeMarkdownLeaf } from './fake-markdown-leaf'

// The markdown tabs a fake workspace holds: which paths are open, which are
// deferred, and the editor each answers with. A leaf per path is kept rather
// than rebuilt per call, so a load that mutates a view is visible to the search
// that re-reads it.
export class FakeMarkdownLeaves {
  private readonly paths: string[] = []
  private readonly deferred = new Set<string>()
  private readonly editors = new Map<string, Editor>()
  private readonly leaves = new Map<string, FakeMarkdownLeaf>()
  // The paths loadIfDeferred was called on, in order, which is what says the
  // ordered search stopped where it claims to.
  readonly loaded: string[] = []

  open(path: string): void {
    if (!this.paths.includes(path)) this.paths.push(path)
    this.leaves.delete(path)
  }

  // A tab that is open but not in front, which is the state Obsidian 1.7.2
  // added and the one no test could construct before.
  defer(path: string): void {
    this.open(path)
    this.deferred.add(path)
  }

  setEditor(path: string, editor: Editor): void {
    this.open(path)
    this.editors.set(path, editor)
  }

  all(): FakeMarkdownLeaf[] {
    return this.paths.map((path) => this.leafOf(path))
  }

  // How many times the view under a path was flushed, which is what says a save
  // reached the leaf rather than silently finding nothing.
  savesOf(path: string): number {
    return this.leaves.get(path)?.saves ?? 0
  }

  // An editor per path, made on first ask, so two leaves never share one handle
  // and a guard comparing handles means something.
  editorOf(path: string): Editor {
    const editor = this.editors.get(path)
    if (editor) return editor
    const fresh = new FakeEditor('').asEditor()
    this.editors.set(path, fresh)
    return fresh
  }

  private leafOf(path: string): FakeMarkdownLeaf {
    const existing = this.leaves.get(path)
    if (existing) return existing
    const leaf = new FakeMarkdownLeaf(path, this.editorOf(path), this.deferred.has(path), (p) =>
      this.recordLoad(p),
    )
    this.leaves.set(path, leaf)
    return leaf
  }

  private recordLoad(path: string): void {
    this.loaded.push(path)
    this.deferred.delete(path)
  }
}
