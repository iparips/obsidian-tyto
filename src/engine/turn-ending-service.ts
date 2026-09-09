import { EditorPosition } from 'obsidian'
import { ChatMessage } from '../model/providers/types'
import { ChatTurn } from '../model/providers/models/chat-turn'
import { Cancelled, Failure, Outcome, Outcomes } from '../shared/models/outcome'
import { NoteEditor } from './note-editing/note-editor'
import { OpenNote } from './note-editing/open-note'
import { TurnOutcomes } from './turn/turn-outcomes'
import { SessionRepository } from '../session/session-repository'

// The ways a turn ends that write what happened to the history before
// returning, so the next turn reads how the last one finished rather than
// finding the record stopping mid-sentence. The rest are TurnOutcomes.
export class TurnEndingService {
  constructor(
    private sessionRepository: SessionRepository,
    private noteEditor: NoteEditor,
  ) {}

  // The model said its piece, so the summary is the answer and the cursor
  // follows the last edit the turn made.
  endTurnWithModelUtterance(
    summary: string,
    note: OpenNote | null,
    editEndPosition: EditorPosition | null,
  ): Outcome<string> {
    this.sessionRepository.appendChatMessage(ChatMessage.model(summary))
    if (note && editEndPosition) this.noteEditor.focusEdit(note.editor, editEndPosition)
    return Outcomes.success(summary)
  }

  endTurnAsCancelled(notesWritten: readonly string[]): Outcome<string> {
    this.sessionRepository.appendChatMessage(
      ChatMessage.model(TurnOutcomes.cancelledNote(notesWritten)),
    )
    return Outcomes.cancelled('chat', notesWritten)
  }

  // An aborted request is the user's cancel arriving mid-flight, so the turn
  // ends the way a cancel between calls does rather than as a chat failure.
  endTurnAsUnfinished(
    answer: Failure<ChatTurn> | Cancelled<ChatTurn>,
    notesWritten: readonly string[],
  ): Outcome<string> {
    if (answer.hasFailed()) return Outcomes.failure(answer.step, answer.message)
    return this.endTurnAsCancelled(notesWritten)
  }
}
