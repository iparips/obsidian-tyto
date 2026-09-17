import { Editor, MarkdownView, TFile } from 'obsidian'

// One markdown tab, in the two states Obsidian 1.7.2 puts it in. A deferred
// leaf's view is a stand-in holding neither file nor editor, and loading it
// replaces that view in place rather than handing back a new leaf.
export class FakeMarkdownLeaf {
  view: unknown

  constructor(
    readonly path: string,
    private editor: Editor,
    private deferred: boolean,
    private onLoadFn: (path: string) => void,
  ) {
    this.view = deferred ? {} : FakeMarkdownLeaf.loadedView(path, editor)
  }

  get isDeferred(): boolean {
    return this.deferred
  }

  async loadIfDeferred(): Promise<void> {
    this.onLoadFn(this.path)
    if (!this.deferred) return
    this.deferred = false
    this.view = FakeMarkdownLeaf.loadedView(this.path, this.editor)
  }

  // A real MarkdownView, since the locator checks instanceof rather than
  // casting: a plain object would pass the fake and fail the plugin.
  private static loadedView(path: string, editor: Editor): MarkdownView {
    const view = new MarkdownView(null as never)
    view.file = { path } as TFile
    view.editor = editor
    return view
  }
}
