import { EditorPosition } from 'obsidian'

export class PositionConverter {
  static offsetToPos(content: string, offset: number): EditorPosition {
    const before = content.slice(0, offset).split('\n')
    return { line: before.length - 1, ch: before[before.length - 1].length }
  }

  static posToOffset(content: string, pos: EditorPosition): number {
    const lines = content.split('\n').slice(0, pos.line)
    const lineChars = lines.reduce((sum, line) => sum + line.length + 1, 0)
    return lineChars + pos.ch
  }
}
