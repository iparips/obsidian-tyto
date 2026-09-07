// Two, because a refusal names the tool the model missed: one retry is the
// model acting on that, and a third is a loop the same reason will refuse again.
const MAX_REPEATS = 2

// How many times running a turn has been refused for the same reason. Counted
// by reason rather than by tool, since a model that retries an edit varies its
// arguments while the refusal stays word for word.
export class RepeatedRefusal {
  private lastReason: string | null = null
  private repeats = 0

  // Any other outcome clears the count: a turn that got somewhere between two
  // refusals is making progress, however slowly.
  record(reason: string | null): void {
    if (reason === null || reason !== this.lastReason) return this.restart(reason)
    this.repeats += 1
  }

  private restart(reason: string | null): void {
    this.lastReason = reason
    this.repeats = reason === null ? 0 : 1
  }

  isStuck(): boolean {
    return this.repeats >= MAX_REPEATS
  }

  // What the turn ends with, so the user reads the reason rather than a count.
  message(): string {
    return `Owl was refused the same thing ${this.repeats} times and stopped: ${this.lastReason}`
  }
}
