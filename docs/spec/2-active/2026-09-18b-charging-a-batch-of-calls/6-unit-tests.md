---
created: 2026-09-18
updated: 2026-09-18
---

# Unit Tests

All in `src/engine/tests/iteration-counter.test.ts`, which already covers the counter. The suite gains a describe for what a batch costs and keeps everything else.

## Existing tests that change

| Test                                                             | Why it moves                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `spends one step per call, so the count matches the steps list`  | It asserts the charging this spec changes. Rewritten as the batch cost below. |
| `warns when a batch crosses the threshold without landing on it` | `spend(18)` now costs 9.5, which does not cross. See below for its new shape. |

The crossing test has to change shape, not just its number. From an empty counter no realistic batch reaches the threshold any more: it would take thirty-three calls in one reply. The test spends fifteen single calls first, then sends a batch of four, which costs three and lands at eighteen with two remaining, crossing three without landing on it.

Everything asserting single calls stays: `spend(19)`, `spend(20)`, `spend(17)` and the warning text all charge one per call and are unaffected.

## When a reply batches several tool calls

- spends one for a single call, so an unbatched turn is charged as before
- spends three for four calls, since each after the first costs half
- spends two for two calls
- spends one for a reply that called no tool, since the round-trip happened
- keeps the fraction rather than rounding each batch, so two replies of two calls cost four and not four and a half
- rounds up when read, so a turn holding 15.5 reports sixteen spent

## When the turn runs out

- is not spent at nineteen single calls, unchanged
- is spent at twenty single calls, unchanged
- is not spent after the eleven batches of the requirements turn, which cost sixteen
- is spent once those sixteen are followed by four more single calls

## When the turn is running low

- warns on the call that leaves three, unchanged
- warns when a batch crosses the threshold without landing on it, with a batch sized for the new cost
- does not warn twice, unchanged
- names how many steps are left, reading the rounded total rather than the fraction

## Not tested here

Whether a real turn now finishes. That is `4-acceptance-criteria.md`: it needs a vault, a key, and a model that batches.
