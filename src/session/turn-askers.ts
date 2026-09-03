import { Asker } from './session-listeners'
import { TurnNotices } from './turn-notices'
import { OpenApproval } from '../engine/open-approval'
import { UserQuestion } from '../engine/user-question'
import { TurnCancellation } from '../engine/turn-cancellation'
import { QuestionRequest } from './views/SessionPanel'
import { OpenMode } from '../settings/settings'

// The two things a session parks a turn on, wired to the panel that answers and
// the notices that say a turn is waiting. One collaborator, so the plugin hands
// out a pair rather than assembling one per call site.
export class TurnAskers {
  readonly opens = new Asker<string, boolean>(false)
  readonly questions = new Asker<QuestionRequest, string>('')

  constructor(
    private notices: TurnNotices,
    private mode: OpenMode,
  ) {}

  // The mode is a choice of collaborator rather than a branch inside the
  // dispatcher, so every refusal above it runs in both modes (NFR3).
  openApproval(cancellation: TurnCancellation): OpenApproval {
    if (this.mode === 'auto') return OpenApproval.granted()
    return OpenApproval.of(
      (path) => this.noticed(`Owl wants to open ${path}.`, this.opens.ask(path)),
      cancellation,
    )
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
