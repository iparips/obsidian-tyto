---
created: 2026-09-18
updated: 2026-09-18
---

# Charging A Batch Of Calls: Spec

A turn may spend twenty tool calls, and each call costs one however it arrives. A reply carrying four calls is charged four, the same as four replies carrying one each, though it cost a quarter of the round-trips.

The shape that is cheaper for everyone is the one the counter punishes. A real turn hit it: asked for themes across three weeks of tagged notes, the model batched its searches, reached the right notes in eleven replies, and ran out on the step that would have read them. Twenty calls, eleven round-trips, no answer.

The change is one number and where it is rounded. A call after the first in the same reply costs half, the total is kept as a fraction, and it is rounded only when read. That turn then costs sixteen and has four left to answer with.

- [2-requirements.md](2-requirements.md) - the turn that ran out, what is in scope, and the five scenarios
- [3-decisions.md](3-decisions.md) - D1 the curve, D2 why half and not another fraction, D3 the callless reply, D4 why the threshold holds
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - four manual checks, including that a runaway turn still stops
- [5-design-charging-a-batch.md](5-design-charging-a-batch.md) - where the rounding sits, and why it is not per batch
- [6-unit-tests.md](6-unit-tests.md) - the suite, and the two existing tests this changes

Every decision is settled. The design adds no interface: `IterationCounter` keeps its surface, and what changes is what `used` holds.

The build is next. It is one commit against one file, plus the two tests in `6-unit-tests.md` that assert the charging this replaces.
