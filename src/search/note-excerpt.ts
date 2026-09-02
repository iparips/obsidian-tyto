const EXCERPT_WIDTH = 200

// Cut around the match offset the SearchResult already carries, so one hit
// costs a fixed payload however large the note is (NFR6).
export class NoteExcerpt {
  static around(content: string, offset: number): string {
    const start = Math.max(0, offset - EXCERPT_WIDTH / 2)
    const end = Math.min(content.length, start + EXCERPT_WIDTH)
    return NoteExcerpt.ellipsed(content.slice(start, end).trim(), start, end, content.length)
  }

  private static ellipsed(body: string, start: number, end: number, length: number): string {
    const opener = start > 0 ? '...' : ''
    const closer = end < length ? '...' : ''
    return `${opener}${body}${closer}`
  }
}
