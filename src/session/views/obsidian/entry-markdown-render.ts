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
    return () => child.unload()
  }
