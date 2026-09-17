import { Editor, MarkdownView, TFile } from 'obsidian'

// One markdown tab, in the two states Obsidian 1.7.2 puts it in. A deferred
// leaf's view is a stand-in holding neither file nor editor, and loading it
// replaces that view in place rather than handing back a new leaf.
export class FakeMarkdownLeaf {
  view: unknown
  // TextFileView's flush, counted rather than performed: what a test asserts is
  // that the save reached a view at all, which a deferred leaf denied it.
  saves = 0

  constructor(
    readonly path: string,
    private editor: Editor,
    private deferred: boolean,
    private onLoadFn: (path: string) => void,
  ) {
    this.view = deferred ? {} : this.loadedView()
  }

  get isDeferred(): boolean {
    return this.deferred
  }

  async loadIfDeferred(): Promise<void> {
    this.onLoadFn(this.path)
    if (!this.deferred) return
    this.deferred = false
    this.view = this.loadedView()
  }

  // A real MarkdownView, since the locator checks instanceof rather than
  // casting: a plain object would pass the fake and fail the plugin.
  private loadedView(): MarkdownView {
    const view = new MarkdownView(null as never)
    view.file = { path: this.path } as TFile
    view.editor = this.editor
    view.save = async () => {
      this.saves += 1
    }
    return view
  }
}
