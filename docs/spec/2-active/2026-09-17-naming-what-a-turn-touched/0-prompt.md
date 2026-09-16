---
created: 2026-09-17
updated: 2026-09-17
---

# The Prompt

The block to hand a fresh session that will build this spec.

```text
Build the spec in docs/spec/2-active/2026-09-17-naming-what-a-turn-touched.
Three commits, independent of each other.

Read 1-index.md, then 3-requirements.md and 4-decisions.md: every decision is
settled and each cites the rule behind it. Then 8-tasks.md for the build order.
Read 6-design.md and 7-unit-tests.md before commit 1, and
6-design-the-warning.md before commit 3. 5-acceptance-criteria.md holds the
checks afterwards.

Repo conventions are in docs/AGENTS.md. Read
docs/architecture/12-the-panel-vocabulary.md before naming anything: it defines
the three levels this spec talks about.

Check the prerequisite in 8-tasks.md before anything else. A tree without
ProgressLine or TargetNoteWriter is not ready for this spec.

Verify three claims before trusting them. The retargeted entry kind is said to
have exactly one producer, the user's own move, which is what makes removing it
safe; confirm nothing else dispatches it. ToolCallOutcome is said to be built
only through named factories, which is why the write path travels as an argument
to edited rather than as a field. And SESSION_SNAPSHOT_VERSION is said to be at
2 already, so commit 1 moves it to 3 rather than to 2.

One thing the spec cannot tell you, and it is worth five minutes before commit
3: whether a Vault.process write lands in the editor's undo stack when the note
is open. Write that way to an open note and undo in the editor. The warning is
worded for undo being lost; if it survives, drop the second sentence and say so.

Two acceptance checks need a real vault and a moving tab, so you cannot run
them: say so rather than claiming them. If the spec is wrong, fix the spec and
say what changed rather than building around it.
```
