---
created: 2026-09-18
updated: 2026-09-18
---

# Design: Charging A Batch

## Goal

A tool call that arrives in a batch with others costs half of one, after the first in that batch. The allowance stays at twenty, so a turn that batches its searches has room left to read what they found.

## Behaviour change

| Concern                      | Today               | New                                        |
| ---------------------------- | ------------------- | ------------------------------------------ |
| One call in a reply          | 1                   | 1                                          |
| Four calls in one reply      | 4                   | 3                                          |
| A reply with no calls        | 1                   | 1                                          |
| The turn in the requirements | 20 of 20, exhausted | 16 of 20, four left                        |
| What the counter holds       | An integer          | A fractional total, read as a whole number |
| The allowance                | 20                  | 20                                         |
| The warning threshold        | 3 remaining         | 3 remaining                                |

## Where the rounding sits

The total is kept fractional and rounded only when it is read. Rounding each batch as it lands gives a different, worse answer: the turn in the requirements costs eighteen that way and sixteen this way, because eleven separate roundings each throw away up to half a call.

So `spend` accumulates `1 + (calls - 1) / 2` as a fraction, and `isSpent`, `remaining` and the warning all read `Math.ceil` of it. A turn is never charged for a fraction it did not use, and never billed twice for the same rounding.

## New interfaces

None. `IterationCounter` keeps its whole surface: `spend`, `isSpent`, `justRanLow`, `warning`, `max`. What changes is what `used` holds and how `spend` adds to it.

```ts
// A call after the first in the same reply costs half, since it shares the
// round-trip the first one paid for. Accumulated as a fraction and rounded
// only when read: rounding each batch as it lands would charge a turn for
// eleven separate half-calls it never made.
private static costOf(calls: number): number {
  return 1 + (Math.max(calls, 1) - 1) * BATCHED_CALL_COST
}
```

`BATCHED_CALL_COST` is `0.5`, beside `MAX_ITERATIONS` and `WARN_AT_REMAINING`, so the three numbers that decide a turn's room sit together.

## Gating

None. There is no feature-flag machinery in this repo, and the change is to how a number accumulates rather than to a code path that could run either way.

## Out of scope

- The size of the allowance, per the requirements.
- Pricing a call by what it reads. A grep over the whole vault and a glob of one folder cost the same here.
- The repeated-call loop. A cheaper batch makes a repeating model cheaper too, which is the wrong direction and is its own spec.

## Unit tests

Per [6-unit-tests.md](6-unit-tests.md).

## Rollout

One commit. The counter is internal to a turn, nothing persists across turns, and no setting exposes it.

## References

- [2-requirements.md](2-requirements.md) - the turn that ran out with the answer in hand
- [3-decisions.md](3-decisions.md) - D1 the curve, D2 why half, D4 why the threshold holds
- `src/engine/turn/spending/iteration-counter.ts:5` - `MAX_ITERATIONS`, `WARN_AT_REMAINING`, and the `used` this changes
- `src/engine/turn/spending/iteration-counter.ts:18` - `spend`, which floors a callless reply at one
- `src/engine/turn/conversation-turn-runner.ts:73` - `spendOn`, which passes `calls.length` and is unchanged
