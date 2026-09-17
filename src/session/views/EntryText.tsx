import { useEffect, useRef } from 'react'
import { MarkdownRenderFn } from './markdown-render'

export interface EntryTextProps {
  text: string
  // Absent without a vault to render against, which is every test and the
  // reason the plain-text branch is the one that must keep working.
  renderMarkdownFn?: MarkdownRenderFn
}

// The model writes markdown in its replies, and a panel that prints the source
// shows a section name as **Top Ups**. Rendered, it reads the way the note it
// describes reads.
//
// Two branches rather than one: React owns the text node in the plain case, and
// Obsidian owns the children in the rendered one. Mixing them would have React
// reconcile a subtree it did not create.
export const EntryText = ({ text, renderMarkdownFn }: EntryTextProps) => {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const into = host.current
    if (!renderMarkdownFn || !into) return
    // Cleared here rather than by the renderer, which appends: a re-render on
    // changed text would otherwise show both versions.
    into.replaceChildren()
    return renderMarkdownFn(text, into)
  }, [text, renderMarkdownFn])

  if (!renderMarkdownFn) return <div className="tyto-entry-text">{text}</div>
  return <div className="tyto-entry-text" ref={host} />
}
