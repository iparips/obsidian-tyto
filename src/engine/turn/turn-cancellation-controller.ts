// Stops one turn, and says whether it was stopped. Scoped to the turn so a
// cancel never reaches the next utterance. An AbortController rather than a
// boolean, because three readers need three shapes of the same fact: the loop
// polls it, the provider request takes a signal, and a parked question races a
// promise.
export class TurnCancellationController {
  private readonly controller = new AbortController()

  cancel(): void {
    if (this.controller.signal.aborted) return
    this.controller.abort()
  }

  isCancelled(): boolean {
    return this.controller.signal.aborted
  }

  signal(): AbortSignal {
    return this.controller.signal
  }

  // Resolves when cancelled, so a parked question can race its answer against a
  // cancel rather than knowing about one.
  whenCancelled(): Promise<void> {
    if (this.isCancelled()) return Promise.resolve()
    return new Promise((resolve) =>
      this.controller.signal.addEventListener('abort', () => resolve(), { once: true }),
    )
  }
}
