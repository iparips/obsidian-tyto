// One turn's whole allowance, counted in tool calls rather than model replies:
// a reply that batches five calls does five things, and the steps list shows
// five. One number rather than a cap per tool, so a turn that runs out says
// where it went through the list itself.
const DEFAULT_MAX_ITERATIONS = 20
// Warns with three left rather than one, so the user can still cancel and
// rephrase while the turn has room to act on the rephrasing.
const WARN_AT_REMAINING = 3
// What a call after the first in the same reply costs. It shares the round-trip
// the first one paid for, so a turn that batches four searches is charged three
// rather than four. Not free: four greps read four times as much vault as one,
// and a reply of twenty would otherwise cost a single step.
const BATCHED_CALL_COST = 0.5

// How much room a turn has left, and when to say so. A counter rather than a
// bare loop index, because running low is something the user is told about and
// running out is something the reply has to explain.
export class IterationCounter {
  // Fractional, because a batch costs a fraction per call and rounding each one
  // as it lands would charge a turn for half-calls it never made: eleven batches
  // rounded singly cost eighteen where the same calls cost sixteen.
  private used = 0

  constructor(private readonly maxIterations: number = DEFAULT_MAX_ITERATIONS) {}

  // The first call in a reply costs one and the rest cost half, so a turn that
  // batches its searches has room left to read what they found. A reply with no
  // tool calls still costs one, since it is a round-trip.
  spend(calls = 1): void {
    this.used += 1 + (Math.max(calls, 1) - 1) * BATCHED_CALL_COST
  }

  isSpent(): boolean {
    return this.spent() >= this.maxIterations
  }

  // Rounded only here, where the total is read, rather than as it accumulates.
  private spent(): number {
    return Math.ceil(this.used)
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
    return `Tyto is taking longer than usual: ${this.remaining()} steps left this turn.`
  }

  private remaining(): number {
    return Math.max(this.maxIterations - this.spent(), 0)
  }

  max(): number {
    return this.maxIterations
  }
}
