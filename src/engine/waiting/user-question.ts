import { AnswerRequest } from './models/answer-request'
import { PendingAnswer } from './pending-answer'
import { TurnCancellation } from './turn-cancellation'

const NO_ANSWER = ''

// Asks the user a question the model wrote, and hands back what they said.
// Holds nothing between questions: each is asked once and answered once, which
// is what separates it from the per-path hold on an approval (FR15, FR16).
export class UserQuestion {
  constructor(private pending: PendingAnswer<AnswerRequest, string>) {}

  static of(
    ask: (request: AnswerRequest) => Promise<string>,
    cancellation = new TurnCancellation(),
  ): UserQuestion {
    return new UserQuestion(new PendingAnswer(ask, cancellation))
  }

  // Silent, and what a test constructs when the question is not what it is
  // exercising.
  static unanswered(): UserQuestion {
    return UserQuestion.of(() => Promise.resolve(NO_ANSWER))
  }

  // An empty answer when the turn is cancelled, so the loop ends on the
  // cancellation rather than feeding the emptiness back to the model (FR29).
  async answerTo(request: AnswerRequest): Promise<string> {
    return this.pending.awaiting(request, NO_ANSWER)
  }
}
