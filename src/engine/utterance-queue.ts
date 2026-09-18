import { TurnResult } from './turn/ending/turn-result'

// One utterance at a time, so a second spoken while the first runs waits rather
// than interleaving with it.
export class UtteranceQueue {
  // Tail of the chain: resolves once every utterance queued so far has settled.
  // Seeded resolved so the first starts immediately.
  private tail: Promise<unknown> = Promise.resolve()

  constructor(private runFn: (text: string) => Promise<TurnResult>) {}

  // The caller needs the rejection to show a failure message, so it gets the
  // run itself. The chain gets a swallowed copy, or one failure would reject
  // every utterance queued behind it.
  enqueue(text: string): Promise<TurnResult> {
    const running = this.tail.then(() => this.runFn(text))
    this.tail = running.catch(() => undefined)
    return running
  }
}
