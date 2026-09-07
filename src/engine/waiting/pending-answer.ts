import { TurnCancellation } from './turn-cancellation'

// One parked question, settled by the panel or by a cancellation. Generic over
// the request and the answer, because parking is the same work whether what is
// asked is a path and the reply a yes, or a question and the reply a sentence
// (NFR6).
export class PendingAnswer<Request, Answer> {
  constructor(
    private ask: (request: Request) => Promise<Answer>,
    private cancellation: TurnCancellation,
  ) {}

  // Resolves with the fallback when the turn is cancelled rather than answered,
  // so a cancelled turn never leaves the loop parked (FR29).
  async awaiting(request: Request, whenCancelled: Answer): Promise<Answer> {
    return Promise.race([
      this.ask(request),
      this.cancellation.whenCancelled().then(() => whenCancelled),
    ])
  }
}
