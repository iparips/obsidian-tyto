import { Editor, EditorPosition } from 'obsidian'
import { NoteWrite } from './note-write'
import { PositionConverter } from './position-converter'

export type EditOperation =
  | { kind: 'replace'; anchor: string; replacement: string }
  | { kind: 'insert'; anchor: string; position: 'before' | 'after'; content: string }
  | { kind: 'insertAt'; location: 'noteStart' | 'noteEnd' | 'cursor'; content: string }
  | { kind: 'writeNote'; content: string }

// What an edit worked out to, where the write itself has not happened yet.
export type PlannedWrite =
  { applied: true; write: NoteWrite } | { applied: false; reason: 'noMatch' | 'multipleMatches' }

type AnchorMatch =
  { unique: true; index: number } | { unique: false; reason: 'noMatch' | 'multipleMatches' }

export class NoteEditor {
  // The note as text rather than the editor showing it, so an edit can be
  // worked out for a note whose tab has moved and has no editor to read.
  plan(before: string, cursor: EditorPosition, op: EditOperation): PlannedWrite {
    if (op.kind === 'replace') return this.replaceAnchor(before, op.anchor, op.replacement)
    if (op.kind === 'insert') return this.insertAtAnchor(before, op.anchor, op.position, op.content)
    if (op.kind === 'writeNote') return this.writeWholeNote(before, op.content)
    return this.insertAtLocation(before, cursor, op.location, op.content)
  }

  focusEdit(editor: Editor, position: EditorPosition): void {
    editor.setCursor(position)
    editor.scrollIntoView({ from: position, to: position }, true)
  }

  private replaceAnchor(before: string, anchor: string, replacement: string): PlannedWrite {
    const match = this.findAnchor(before, anchor)
    if (!match.unique) return { applied: false, reason: match.reason }
    return this.replaceOffsets(before, match.index, match.index + anchor.length, replacement)
  }

  private insertAtAnchor(
    before: string,
    anchor: string,
    position: 'before' | 'after',
    content: string,
  ): PlannedWrite {
    const match = this.findAnchor(before, anchor)
    if (!match.unique) return { applied: false, reason: match.reason }
    const offset = position === 'before' ? match.index : match.index + anchor.length
    return this.replaceOffsets(before, offset, offset, content)
  }

  // One replaceRange over the whole note, so Obsidian's undo stack holds the
  // write as a single entry the user can take back with one editor undo.
  private writeWholeNote(before: string, content: string): PlannedWrite {
    return this.replaceOffsets(before, 0, before.length, content)
  }

  private insertAtLocation(
    before: string,
    cursor: EditorPosition,
    location: 'noteStart' | 'noteEnd' | 'cursor',
    content: string,
  ): PlannedWrite {
    const offset = this.locationOffset(before, cursor, location)
    return this.replaceOffsets(before, offset, offset, content)
  }

  private locationOffset(
    before: string,
    cursor: EditorPosition,
    location: 'noteStart' | 'noteEnd' | 'cursor',
  ): number {
    if (location === 'noteStart') return 0
    if (location === 'noteEnd') return before.length
    return PositionConverter.posToOffset(before, cursor)
  }

  private findAnchor(before: string, anchor: string): AnchorMatch {
    const first = before.indexOf(anchor)
    if (first === -1) return { unique: false, reason: 'noMatch' }
    if (before.indexOf(anchor, first + 1) !== -1)
      return { unique: false, reason: 'multipleMatches' }
    return { unique: true, index: first }
  }

  private replaceOffsets(before: string, from: number, to: number, text: string): PlannedWrite {
    return { applied: true, write: NoteWrite.ofReplacedOffsets(before, from, to, text) }
  }
}
