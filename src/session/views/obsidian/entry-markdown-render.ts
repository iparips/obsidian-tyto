import { App, Component, MarkdownRenderer } from 'obsidian'
import { MarkdownRenderFn } from '../markdown-render'

// Obsidian's own renderer rather than a markdown library: it is already a
// dependency, it reads the vault's flavour including wikilinks and callouts,
// and it carries the sanitising that model output going into the DOM needs.
export const entryMarkdownRender =
  (app: App): MarkdownRenderFn =>
  (markdown, into) => {
    // One child per render, rather than the view itself. The renderer attaches
    // its own children to whatever component it is given, so a long-lived one
    // would accumulate them for every entry the session ever showed.
    const child = new Component()
    child.load()
    // The render is async and the cleanup is not, so an entry unmounted while
    // it is in flight unloads the child and drops what lands after.
    void MarkdownRenderer.render(app, markdown, into, '', child)
    // Held in a const, so the cleanup removes the listener it added rather than
    // a second function that merely looks the same.
    const onClick = openInternalLink(app)
    into.addEventListener('click', onClick)
    return () => {
      into.removeEventListener('click', onClick)
      child.unload()
    }
  }

// A wikilink the model cited renders as an anchor, but the click that follows
// one is the containing view's to handle, and this panel is not a markdown
// view. One listener on the host rather than one per link, since the renderer
// owns the children and replaces them.
//
// The href carries the link as written, which is the path a search returned, so
// it resolves from the vault root and needs no source path to resolve against.
const openInternalLink = (app: App) => (event: MouseEvent) => {
  const anchor = (event.target as HTMLElement | null)?.closest?.('a.internal-link')
  if (!anchor) return
  event.preventDefault()
  const target = anchor.getAttribute('href') ?? anchor.textContent
  if (target) void app.workspace.openLinkText(target, '', false)
}
