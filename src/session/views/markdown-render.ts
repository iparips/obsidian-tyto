// Renders an entry's markdown into an element the panel owns. Obsidian's own
// renderer is what satisfies this: a reply names a section the way the note
// writes it, so it should read the way the note reads.
//
// A port rather than an import, because nothing under views/ outside obsidian/
// may reach for Obsidian. Absent in the suite and wherever a panel renders
// without a vault, which is what makes the plain-text fallback the default
// rather than an error path.
//
// Returns a cleanup for the render's own lifecycle, so an entry unmounted
// mid-render takes its rendered children with it.
export type MarkdownRenderFn = (markdown: string, into: HTMLElement) => () => void
