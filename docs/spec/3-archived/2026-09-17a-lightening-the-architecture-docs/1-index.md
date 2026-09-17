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
- [6-design.md](6-design.md) - what each subsystem file holds, and what is deliberately left to the code
- [7-tasks.md](7-tasks.md) - the build order
- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will design and build it

Lightweight is the brief: a diagram and the boundaries per subsystem, with
detail left to the code. What a doc should hold is what a reader cannot grep,
which is why something sits where it does and what is deliberately absent.

All three decisions are settled: seven subsystem files, all six release files
gone, and the size table dropped with the limit kept.

Built. The folder is seven subsystem files, each carrying a diagram, and 1349
lines became 898. All four acceptance checks pass: every inbound link resolves,
the size table is gone, and no file states a count the next merge falsifies.
