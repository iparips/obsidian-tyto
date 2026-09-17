---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Prompt

Hands the build to a fresh session. Paste the block whole.

```text
Build the multi-note editing fix specified in
docs/spec/2-active/2026-09-17f-multi-note-editing. Work on main, in this
checkout.

Read 1-index.md, then 7-tasks.md, which owns the build order. Read
5-design-stable-step-target.md before writing the guard and 6-unit-tests.md
before writing the tests. 3-decisions.md holds why, and every decision in it is
resolved, so nothing there is waiting on you.

The repo's conventions are in CLAUDE.md and docs/architecture. Read
2-vocabulary.md before naming anything, since turn, turn step and retarget are
easy to confuse, and 6-reaching-a-note.md before moving anything that touches
the target.

Verify these before trusting them. They were read on 2026-09-18 and the code
may have moved. ToolCallExecutor.executeToolCalls loops one step's calls and is
called from conversation-turn-runner.ts:63. SessionRepository.bindTo runs
unconditionally in ToolDispatcher.moveSessionTargetNoteTo, where
turnRepository.retargetTo runs only on a successful resolve: the design's choice
of which target to compare rests on that difference, so check it holds before
writing the guard. refuseSecondEdit deliberately skips RepeatedRefusalCounter,
and the comment above it says why.

The suite was green at 1400 tests before this work started. 7-tasks.md says
what to run and when.

4-acceptance-criteria.md holds what the suite cannot judge. It needs a real
vault and a real API key, and it decides whether commit 2 happens at all. Do not
run it yourself unless asked; say the work is ready for it.

If the spec is wrong, say so and fix it rather than designing around it. D4's
body was corrected during design for exactly this reason, and the code may have
moved again since.
```
