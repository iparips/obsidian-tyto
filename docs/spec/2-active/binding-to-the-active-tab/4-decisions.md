---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D1: Should an unbound session say so in the panel beyond the header going blank? [resolved 2026-09-16]

Not in this spec. Ilya:
[recording-a-retarget](../recording-a-retarget/1-index.md) publishes a step when
the session retargets, and that step says the session is unbound. The panel then
says so without this spec adding anything beside the header.

The concern was that a blank header reads as a fault rather than as an unbound
session, since the session still searches and answers when unbound. The sibling
answers it as a side effect of what it already builds.

### Assumptions

- Obsidian fires file-open when the active tab changes to one holding no file.
  Switching between two tabs that each hold a note does retarget the session,
  so the subscription works. If an empty tab fires nothing rather than firing
  null, the design's seam moves from retargetActiveEngine to another event,
  most likely active-leaf-change.

## Design

### Assumptions

- A turn in flight keeps the note it started on when the session unbinds.
  EditEngine.retargetRunningTurn returns early when the resolve finds nothing,
  which is what an unbound session produces. That is already how a note the
  resolver cannot reach behaves, so the design leaves it alone. A turn that
  should instead stop when its note goes away is a behaviour change this spec
  does not make.
- Widening SessionRepository.changeTargetNote leaves ToolDispatcher unchanged.
  It calls the method at tool-dispatcher.ts:253 and always has a path, so a
  parameter that also accepts null costs it nothing.
