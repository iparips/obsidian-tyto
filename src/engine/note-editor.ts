import { Editor, EditorPosition } from 'obsidian'
import { NoteDetails } from './models/note-details'
import { PositionConverter } from './position-converter'

export type EditOperation =
  | { kind: 'replace'; anchor: string; replacement: string }
  | { kind: 'insert'; anchor: string; position: 'before' | 'after'; content: string }
  | { kind: 'insertAt'; location: 'noteStart' | 'noteEnd' | 'cursor'; content: string }

// endedAt is where the edit finished, so the caller can focus it later without
// the editor remembering anything.
export type ApplyResult =
  | { applied: true; endedAt: EditorPosition }
  | { applied: false; reason: 'noMatch' | 'multipleMatches' }

type AnchorMatch =
  { unique: true; index: number } | { unique: false; reason: 'noMatch' | 'multipleMatches' }

export class NoteEditor {
  apply(editor: Editor, note: NoteDetails, op: EditOperation): ApplyResult {
    if (op.kind === 'replace') return this.replaceAnchor(editor, op.anchor, op.replacement)
    if (op.kind === 'insert') return this.insertAtAnchor(editor, op.anchor, op.position, op.content)
    return this.insertAtLocation(editor, note, op.location, op.content)
  }

  focusEdit(editor: Editor, position: EditorPosition): void {
    editor.setCursor(position)
    editor.scrollIntoView({ from: position, to: position }, true)
  }

  private replaceAnchor(editor: Editor, anchor: string, replacement: string): ApplyResult {
    const match = this.findAnchor(editor, anchor)
    if (!match.unique) return { applied: false, reason: match.reason }
    return this.replaceOffsets(editor, match.index, match.index + anchor.length, replacement)
  }

  private insertAtAnchor(
    editor: Editor,
    anchor: string,
    position: 'before' | 'after',
    content: string,
  ): ApplyResult {
    const match = this.findAnchor(editor, anchor)
    if (!match.unique) return { applied: false, reason: match.reason }
    const offset = position === 'before' ? match.index : match.index + anchor.length
    return this.replaceOffsets(editor, offset, offset, content)
  }

  private insertAtLocation(
    editor: Editor,
    note: NoteDetails,
    location: 'noteStart' | 'noteEnd' | 'cursor',
    content: string,
  ): ApplyResult {
    const offset = this.locationOffset(editor, note, location)
    return this.replaceOffsets(editor, offset, offset, content)
  }

  private locationOffset(
    editor: Editor,
    note: NoteDetails,
    location: 'noteStart' | 'noteEnd' | 'cursor',
  ): number {
    const content = editor.getValue()
    if (location === 'noteStart') return 0
    if (location === 'noteEnd') return content.length
    return PositionConverter.posToOffset(content, note.cursor)
  }

  private findAnchor(editor: Editor, anchor: string): AnchorMatch {
    const content = editor.getValue()
    const first = content.indexOf(anchor)
    if (first === -1) return { unique: false, reason: 'noMatch' }
    if (content.indexOf(anchor, first + 1) !== -1)
      return { unique: false, reason: 'multipleMatches' }
    return { unique: true, index: first }
  }

  private replaceOffsets(editor: Editor, from: number, to: number, text: string): ApplyResult {
    const content = editor.getValue()
    const start = PositionConverter.offsetToPos(content, from)
    editor.replaceRange(text, start, PositionConverter.offsetToPos(content, to))
    const endedAt = PositionConverter.offsetToPos(editor.getValue(), from + text.length)
    return { applied: true, endedAt }
  }
}
