import { AnswerRequest } from './answer-request'
import { PendingAnswer } from './pending-answer'
import { TurnCancellationController } from '../turn/turn-cancellation-controller'

const NO_ANSWER = ''

// Asks the user a question the model wrote, and hands back what they said.
// Holds nothing between questions: each is asked once and answered once, which
// is what separates it from the per-path hold on an approval (FR15, FR16).
export class UserQuestionService {
  constructor(private pending: PendingAnswer<AnswerRequest, string>) {}

  static of(
    askFn: (request: AnswerRequest) => Promise<string>,
    cancellationController = new TurnCancellationController(),
  ): UserQuestionService {
    return new UserQuestionService(new PendingAnswer(askFn, cancellationController))
  }

  // Silent, and what a test constructs when the question is not what it is
  // exercising.
  static unanswered(): UserQuestionService {
    return UserQuestionService.of(() => Promise.resolve(NO_ANSWER))
  }

  // An empty answer when the turn is cancelled, so the loop ends on the
  // cancellation rather than feeding the emptiness back to the model (FR29).
  async answerTo(request: AnswerRequest): Promise<string> {
    return this.pending.awaiting(request, NO_ANSWER)
  }
}
