import { EditorPosition } from 'obsidian'
import { ChatMessage } from '../providers/types'
import { ChatTurn } from '../providers/models/chat-turn'
import { Cancelled, Failure, Outcome, Outcomes } from '../shared/models/outcome'
import { NoteEditor } from './note-editing/note-editor'
import { OpenNote } from './note-editing/open-note'
import { IterationBudget } from './turn/iteration-budget'
import { RepeatedRefusal } from './turn/repeated-refusal'
import { SessionRepository } from '../session/session-repository'

// The five ways a turn ends. Each writes what happened to the history before
// returning, so the next turn reads how the last one finished rather than
// finding the record stopping mid-sentence.
export class TurnConclusion {
  constructor(
    private sessionRepository: SessionRepository,
    private noteEditor: NoteEditor,
  ) {}

  // The model said its piece, so the summary is the answer and the cursor
  // follows the last edit the turn made.
  utterance(
    summary: string,
    note: OpenNote | null,
    editEndPosition: EditorPosition | null,
  ): Outcome<string> {
    this.sessionRepository.appendChatMessage(ChatMessage.model(summary))
    if (note && editEndPosition) this.noteEditor.focusEdit(note.editor, editEndPosition)
    return Outcomes.success(summary)
  }

  // The history keeps the fact rather than the partial results, so the next turn
  // knows the work stopped without being invited to resume it.
  cancelled(writtenNotes: readonly string[]): Outcome<string> {
    this.sessionRepository.appendChatMessage(
      ChatMessage.model(TurnConclusion.cancelledNote(writtenNotes)),
    )
    return Outcomes.cancelled('chat', writtenNotes)
  }

  // An aborted request is the user's cancel arriving mid-flight, so the turn
  // ends the way a cancel between calls does rather than as a chat failure.
  unfinished(
    answer: Failure<ChatTurn> | Cancelled<ChatTurn>,
    writtenNotes: readonly string[],
  ): Outcome<string> {
    if (answer.hasFailed()) return Outcomes.failure(answer.step, answer.message)
    return this.cancelled(writtenNotes)
  }

  // Ends on the reason itself, since a model refused the same way twice will
  // spend every remaining step being refused a third way.
  static stuck(refusals: RepeatedRefusal): Outcome<string> {
    return Outcomes.failure('chat', refusals.message())
  }

  // Points at the steps list rather than repeating it: every step is numbered
  // there, so where the turn went is already on screen.
  static exhausted(): Outcome<string> {
    return Outcomes.failure(
      'chat',
      `Owl ran out of steps for this turn after ${IterationBudget.max()}. The steps list shows where they went. Try a smaller instruction, or say which note to use.`,
    )
  }

  private static cancelledNote(written: readonly string[]): string {
    if (written.length === 0) return 'The user stopped this turn. Nothing was changed.'
    return `The user stopped this turn. Already changed: ${written.join(', ')}.`
  }
}
