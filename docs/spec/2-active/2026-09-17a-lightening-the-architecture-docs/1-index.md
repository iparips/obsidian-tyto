---
created: 2026-09-17
updated: 2026-09-17
---

# Lightening The Architecture Docs: Spec

The architecture folder is 1349 lines across 13 files, written per release
rather than per subsystem. Four releases shipped and are described as a chain of
deltas, so no file says what is true now; two more describe releases that do not
exist yet.

The prose also restates what the code says, which is why it drifts. Three of
four sampled rows in the package size table are already wrong, and its closing
claim that every folder is within the limit is false.

- [3-requirements.md](3-requirements.md) - the delta chain, the unbuilt releases, and the prose that drifts
- [4-decisions.md](4-decisions.md) - what the subsystems are, what happens to the release files, and to the size table
- [5-acceptance-criteria.md](5-acceptance-criteria.md) - four checks, one scriptable
- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will design and build it

Lightweight is the brief: a diagram and the boundaries per subsystem, with
detail left to the code. What a doc should hold is what a reader cannot grep,
which is why something sits where it does and what is deliberately absent.

All three decisions are settled: seven subsystem files, all six release files
gone, and the size table dropped with the limit kept. The design is still to
write, and it is a reading task: what survives of 1349 lines is a decision that
needs those lines read rather than recalled.
