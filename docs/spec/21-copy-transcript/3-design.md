---
created: 2026-09-10
updated: 2026-09-11
---

# Design

A Copy button in the panel header writes the session to the clipboard as
Markdown. The panel supplies what the user saw; a new session-scoped repository
supplies what the model was sent, recorded step by step as the turns run.

## Goal

Make a failed session filable. The panel is its only record, and that record
cannot be selected, carries no inputs, and truncates as a screenshot.

## Where the detail lives

- [3a-document-shape.md](3a-document-shape.md) - the two groupings, what a turn
  step sends, and how its panel steps are found
- [3b-wiring.md](3b-wiring.md) - the store, how it reaches both sides, and the
  button

## Test plan

Per [5-test-plan.md](5-test-plan.md). Every case is pure, so the format is
covered without a DOM or a model.

## Out of scope

- Saving to a file in the vault. The clipboard is what a session is filed from.
- Redaction beyond the API key. Note text and vault instructions go verbatim,
  which is the point of it.
- Restoring or replaying a session, which would need engine state the export
  never held.
- Truncating a long transcript, which loses the repetition explaining the
  failure.

## References

- [2-requirements.md](2-requirements.md) - open first; what a filed session must carry, and the two open questions
- [4-sample-output.md](4-sample-output.md) - the format this builds, taken from the reported session
- [5-test-plan.md](5-test-plan.md) - the unit cases, per class
- [src/model/model-request-mapper.ts](../../../src/model/model-request-mapper.ts):16 - the four parts, and the order they are sent in
- [src/engine/turn/model-service.ts](../../../src/engine/turn/model-service.ts):27 - the call site that records, already holding the session repository
- [src/engine/engine-factory.ts](../../../src/engine/engine-factory.ts):56 - where the session-scoped repositories are built
- [src/session/views/HistoryEntry.tsx](../../../src/session/views/HistoryEntry.tsx):41 - the clipboard call and copied-state feedback the button follows
