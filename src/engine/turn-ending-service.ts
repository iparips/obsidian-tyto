import { EditorPosition } from 'obsidian'
import { ChatMessage } from '../model/providers/types'
import { ChatTurn } from '../model/providers/models/chat-turn'
import { Cancelled, Failure, Outcomes } from '../shared/models/outcome'
import { TargetNoteWriter } from './note-editing/target-note-writer'
import { OpenNote } from './note-editing/open-note'
import { TurnOutcomes } from './turn/ending/turn-outcomes'
import { TurnEndingKind } from './turn/ending/turn-ending-kind'
import { EndedTurn, TurnStepOutcomes } from './turn/ending/turn-step-outcome'
import { SessionRepository } from '../session/session-repository'

// The ways a turn ends that write what happened to the history before
// returning, so the next turn reads how the last one finished rather than
// finding the record stopping mid-sentence. The rest are TurnOutcomes.
// Each names the ending it is, so the runner reads the decision rather than
// making it a second time from the same answer.
export class TurnEndingService {
  constructor(
    private sessionRepository: SessionRepository,
    private targetNoteWriter: TargetNoteWriter,
  ) {}

  // The model said its piece, so the summary is the answer and the cursor
  // follows the last edit the turn made.
  endTurnWithModelUtterance(
    summary: string,
    note: OpenNote | null,
    editEndPosition: EditorPosition | null,
  ): EndedTurn {
    this.sessionRepository.appendChatMessage(ChatMessage.model(summary))
    if (note && editEndPosition) this.targetNoteWriter.focusEdit(note, editEndPosition)
    return TurnStepOutcomes.endedTurn(TurnEndingKind.Replied, Outcomes.success(summary))
  }

  // The answer is the turn's reply, so the history keeps it rather than the
  // restatement a further step would have written. No cursor moves: a turn that
  // answered from search wrote nothing to follow.
  endTurnWithAnswer(answer: string): EndedTurn {
    this.sessionRepository.appendChatMessage(ChatMessage.model(answer))
    return TurnStepOutcomes.endedTurn(TurnEndingKind.Answered, Outcomes.success(answer))
  }

  endTurnAsCancelled(notesWritten: readonly string[]): EndedTurn {
    this.sessionRepository.appendChatMessage(
      ChatMessage.model(TurnOutcomes.cancelledNote(notesWritten)),
    )
    return TurnStepOutcomes.endedTurn(
      TurnEndingKind.Cancelled,
      Outcomes.cancelled('chat', notesWritten),
    )
  }

  // An aborted request is the user's cancel arriving mid-flight, so the turn
  // ends the way a cancel between calls does rather than as a chat failure.
  // Which of the two it was is decided here and nowhere else: the runner reads
  // the kind off what comes back.
  endTurnAsUnfinished(
    answer: Failure<ChatTurn> | Cancelled<ChatTurn>,
    notesWritten: readonly string[],
  ): EndedTurn {
    if (answer.hasFailed())
      return TurnStepOutcomes.endedTurn(
        TurnEndingKind.Failed,
        Outcomes.failure(answer.step, answer.message),
      )
    return this.endTurnAsCancelled(notesWritten)
  }
}
