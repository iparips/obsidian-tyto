// One turn's whole allowance, counted in tool calls rather than model replies:
// a reply that batches five calls does five things, and the steps list shows
// five. One number rather than a cap per tool, so a turn that runs out says
// where it went through the list itself.
const MAX_ITERATIONS = 20
// Warns with three left rather than one, so the user can still cancel and
// rephrase while the turn has room to act on the rephrasing.
const WARN_AT_REMAINING = 3

// How much room a turn has left, and when to say so. A counter rather than a
// bare loop index, because running low is something the user is told about and
// running out is something the reply has to explain.
export class IterationBudget {
  private used = 0

  // Spent per tool call, so the count matches the numbered steps the user reads.
  // A reply with no tool calls still costs one, since it is a round-trip.
  spend(calls = 1): void {
    this.used += Math.max(calls, 1)
  }

  isSpent(): boolean {
    return this.used >= MAX_ITERATIONS
  }

  private warned = false

  // True once, on the first check at or past the threshold, so the panel gains
  // one line rather than one per step after it. A batch can cross the threshold
  // without landing on it exactly, which is why this is not an equality.
  justRanLow(): boolean {
    if (this.warned || this.remaining() > WARN_AT_REMAINING || this.remaining() === 0) return false
    this.warned = true
    return true
  }

  warning(): string {
    return `Owl is taking longer than usual: ${this.remaining()} steps left this turn.`
  }

  private remaining(): number {
    return Math.max(MAX_ITERATIONS - this.used, 0)
  }

  static max(): number {
    return MAX_ITERATIONS
  }
}
