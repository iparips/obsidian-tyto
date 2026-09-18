import { ChatMessage } from '../providers/types'
import { NoteDetails } from '../../engine/note-editing/note-details'

// Last, and re-read every step from wherever a write to the note would go.
// Anything the conversation says about the note is a record of an earlier
// state, including the user's own manual edits, so this copy is the only
// current one.
export class NoteContextMessage {
  static build(note: NoteDetails, turnNumber = 1): ChatMessage {
    return ChatMessage.system(
      [
        `This is turn ${turnNumber}.`,
        `Note path: ${note.path}`,
        `Cursor line: ${note.cursor.line}`,
        'This is the note as it is right now, re-read for this message. It supersedes any',
        'earlier copy or description in this conversation, including your own. The user may',
        'have edited it since the last turn. Never answer from an earlier copy.',
        'Note content:',
        '```markdown',
        note.content,
        '```',
      ].join('\n'),
    )
  }
}
