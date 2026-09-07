// Whether one turn was cancelled, held for the turn so a cancel never reaches
// the next utterance. An AbortController rather than a boolean, because the
// provider request needs a signal and a parked question needs a promise.
export class TurnCancellation {
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
