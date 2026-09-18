---
created: 2026-09-18
updated: 2026-09-18
---

# Decisions

## Requirements

### D1: What does a batch of calls cost? [resolved 2026-09-18]

The first call costs one, and each call after it in the same reply costs half, rounded up at the end. Four calls cost three; two cost two; one costs one.

The allowance exists to stop a turn running forever, and what runs forever is round-trips, not calls. But a batch is not free either: four greps read four times as much vault as one, and the results all land in the model's context. Charging a batch as one call would make a reply of twenty greps cost a single step, which is the opposite failure.

Halving after the first keeps both. A turn can still only send twenty replies' worth of work, and a model that batches well gets more done inside the same twenty.

| Option                     | Four calls cost | Twenty calls in one reply cost | Against it                                                       |
| -------------------------- | --------------- | ------------------------------ | ---------------------------------------------------------------- |
| One per call (today)       | 4               | 20                             | Punishes the cheap shape; the turn in Why died on it             |
| One per reply              | 1               | 1                              | A reply of twenty greps is free, and the allowance stops binding |
| First at one, rest at half | 3               | 11                             | An arbitrary curve, which D2 covers                              |

### D2: Why half, rather than some other fraction? [resolved 2026-09-18]

Because it is the simplest fraction that changes the outcome, and nothing here justifies a tuned one.

The number this has to beat is the turn in Why: twenty calls across eleven replies, which today costs exactly twenty and leaves nothing.

| Fraction       | That turn costs | Leaves | A reply of twenty calls costs |
| -------------- | --------------- | ------ | ----------------------------- |
| One (today)    | 20              | 0      | 20                            |
| Three-quarters | 18              | 2      | 15                            |
| Half           | 16              | 4      | 11                            |
| One-quarter    | 14              | 6      | 6                             |

Three-quarters leaves two, which is one read and an answer with nothing spare. Half leaves four. One-quarter leaves six, but a reply of twenty greps then costs six of twenty, which is close enough to free to invite it.

Half has an obvious reading as well as the right shape: the second call in a reply is worth half the first, because it shares the round-trip. A fraction picked to two decimal places would imply a precision the measurement does not have.

Revisit if a real vault shows a turn spending its allowance on batches that each read the whole vault. The fix then is to price a call by what it reads, which is a different spec and a much larger one.

### D3: Does a reply with no tool calls still cost one? [resolved 2026-09-18]

Yes, unchanged. `spend` already floors at one for this, and the reason holds: a reply that says something and calls nothing is still a round-trip, and a turn that produced only those would otherwise run forever.

### D4: Does the warning threshold move? [resolved 2026-09-18]

No. It stays at three remaining, read off the same allowance, and the existing `justRanLow` already handles a batch crossing the threshold without landing on it.

A cheaper batch means the warning arrives later in wall-clock terms, which is the point: the turn has more room, so it warns when it is genuinely close rather than when it has made twelve calls.
