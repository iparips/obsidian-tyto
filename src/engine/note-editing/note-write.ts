import { EditorPosition } from 'obsidian'
import { PositionConverter } from './position-converter'

// What an edit worked out to, before anything is written. Carries the whole new
// note for a vault write and the replaced range for an editor one, so the same
// value goes through either without the caller working the other form out.
export class NoteWrite {
  private constructor(
    readonly content: string,
    readonly replacement: string,
    readonly from: EditorPosition,
    readonly to: EditorPosition,
    readonly endedAt: EditorPosition,
  ) {}

  // The offsets are against the note as it was, and endedAt against the note as
  // it is, which is why both are worked out here rather than by a caller
  // holding one of the two.
  static ofReplacedOffsets(before: string, from: number, to: number, text: string): NoteWrite {
    const content = before.slice(0, from) + text + before.slice(to)
    return new NoteWrite(
      content,
      text,
      PositionConverter.offsetToPos(before, from),
      PositionConverter.offsetToPos(before, to),
      PositionConverter.offsetToPos(content, from + text.length),
    )
  }
}
