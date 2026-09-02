import { Editor, EditorPosition } from 'obsidian'
import { PositionConverter } from '../engine/position-converter'

export class FakeEditor {
  cursor: EditorPosition = { line: 0, ch: 0 }
  scrolledTo: EditorPosition | null = null

  constructor(public content: string) {}

  asEditor(): Editor {
    return this as unknown as Editor
  }

  getValue(): string {
    return this.content
  }

  replaceRange(text: string, from: EditorPosition, to: EditorPosition): void {
    const start = PositionConverter.posToOffset(this.content, from)
    const end = PositionConverter.posToOffset(this.content, to)
    this.content = this.content.slice(0, start) + text + this.content.slice(end)
  }

  getCursor(): EditorPosition {
    return this.cursor
  }

  setCursor(pos: EditorPosition): void {
    this.cursor = pos
  }

  scrollIntoView(range: { from: EditorPosition; to: EditorPosition }): void {
    this.scrolledTo = range.from
  }
}
