---
created: 2026-09-11
updated: 2026-09-11
---

# Implementation Prompt

Paste the block below to a fresh agent. It is a file rather than a section of
[1-index.md](1-index.md) so it can be pasted whole, and it points at the spec
rather than repeating it: anything restated here is a third place to drift.

```text
Implement the copy session transcript feature, specified in
docs/spec/3-archived/20-copy-transcript/.

Read 1-index.md, then 2-requirements.md, then 6-tasks.md. The tasks file is the
build order: four commits, each standing alone with its tests green. Read
3a-document-shape.md before commit 1, 3b-wiring.md before commit 2, and
4-sample-output.md before commit 3, which is the format you are building.

Repo conventions are in docs/AGENTS.md, and the branching rules in CLAUDE.md.

Two claims in the spec are about code that may have moved since it was written.
Check both rather than trusting them:

- That ModelService records before the provider call, and that
  ConversationTurnRunner has exactly five return paths to record an ending on.
- That SessionBuilder can construct the store and pass it both to
  EngineFactory.build and to the panel props.

The end-to-end check is a judgement the suite cannot make: copy a real failing
session, paste it into a note, and confirm the repeated steps read as repeats
and the appendix holds one copy of each prompt part.

If the spec turns out to be wrong about the code, say so and update the spec
rather than working around it.
```
