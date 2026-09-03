import { Asker } from './session-listeners'
import { TurnNotices } from './turn-notices'
import { NoteChoice } from '../engine/note-choice'
import { ChosenNotes } from '../engine/models/chosen-notes'
import { ChoiceRequest } from '../engine/models/choice-request'
import { UserQuestion } from '../engine/user-question'
import { TurnCancellation } from '../engine/turn-cancellation'
import { QuestionRequest } from './views/SessionPanel'
import { OpenMode } from '../settings/settings'

// The two things a session parks a turn on, wired to the panel that answers and
// the notices that say a turn is waiting. One collaborator, so the plugin hands
// out a pair rather than assembling one per call site.
export class TurnAskers {
  readonly choices = new Asker<ChoiceRequest, string | null>(null)
  readonly questions = new Asker<QuestionRequest, string>('')

  constructor(
    private notices: TurnNotices,
    private mode: OpenMode,
  ) {}

  // The mode is a choice of collaborator rather than a branch inside the
  // dispatcher, so every refusal above it runs in both modes (FR13). The set
  // comes from the turn, so a note chosen in one turn is asked about again in
  // the next (FR5).
  noteChoice(cancellation: TurnCancellation, chosen: ChosenNotes): NoteChoice {
    if (this.mode === 'auto') return NoteChoice.automatic(chosen)
    return NoteChoice.of(
      (request) => this.noticed(TurnAskers.noticeFor(request), this.choices.ask(request)),
      cancellation,
      chosen,
    )
  }

  // The notice says the turn wants the user rather than listing the notes: the
  // panel entry carries the list, and a notice has no room for one.
  private static noticeFor({ candidates }: ChoiceRequest): string {
    if (candidates.length === 1) return `Owl wants to open ${candidates[0]}.`
    return `Owl found ${candidates.length} notes and wants you to pick one.`
  }

  userQuestion(cancellation: TurnCancellation): UserQuestion {
    return UserQuestion.of(
      (request) => this.noticed(request.question, this.questions.ask(request)),
      cancellation,
    )
  }

  // The notice goes up as the question is asked and comes down as it is
  // answered, so a waiting turn is noticeable without taking the screen and
  // without outliving what it announced (FR20, FR21).
  private async noticed<T>(text: string, answer: Promise<T>): Promise<T> {
    this.notices.waiting(text)
    try {
      return await answer
    } finally {
      this.notices.dismiss()
    }
  }
}
