import { ChatMessage } from '../providers/types'
import { NoteDetails } from '../../engine/note-editing/note-details'

// Last, and re-read from the editor every turn. Anything the conversation says
// about the note is a record of an earlier state, including the user's own
// manual edits between turns, so this copy is the only current one.
export class NoteContextMessage {
  static build(note: NoteDetails): ChatMessage {
    return ChatMessage.system(
      [
        `Note path: ${note.path}`,
        `Cursor line: ${note.cursor.line}`,
        'This is the note as it is right now, re-read from the editor. It supersedes any',
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
