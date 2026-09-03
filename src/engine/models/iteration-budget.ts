const MAX_ITERATIONS = 10
// Warns with three left rather than one, so the user can still cancel and
// rephrase while the turn has room to act on the rephrasing.
const WARN_AT_REMAINING = 3

// How much room a turn has left, and when to say so. A counter rather than a
// bare loop index, because running low is something the user is told about and
// running out is something the reply has to explain.
export class IterationBudget {
  private used = 0

  spend(): void {
    this.used += 1
  }

  isSpent(): boolean {
    return this.used >= MAX_ITERATIONS
  }

  // True once, on the iteration that crosses the threshold, so the panel gains
  // one line rather than one per iteration after it.
  justRanLow(): boolean {
    return this.remaining() === WARN_AT_REMAINING
  }

  warning(): string {
    return `Owl is taking longer than usual: ${this.remaining()} steps left this turn.`
  }

  private remaining(): number {
    return MAX_ITERATIONS - this.used
  }

  static max(): number {
    return MAX_ITERATIONS
  }
}
