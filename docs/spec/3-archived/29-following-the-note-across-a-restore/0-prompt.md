---
created: 2026-09-15
updated: 2026-09-15
---

# Implementation Prompt

The block to paste into a fresh session that will build this spec.

```text
Build the spec in docs/spec/2-active/following-the-note-across-a-restore: a
session is bound to the open markdown note, or to null when nothing markdown is
open, whether it is new, restored, or already running.

Read 1-index.md, 2-requirements.md and 4-design.md before starting. 3-transcript.md
is the reported session and explains what a wrong binding looks like in practice;
read it if the requirements leave you unsure what went wrong. 5-tasks.md gives
the build order in three commits and opens with two things to measure first. The
suite must stay green at each commit.

Repo conventions are in docs/AGENTS.md: package layout, the rule that wiring is
the only place that constructs across packages, test placement, and the rule
that a prompt change is a behaviour change. Read it first.

Verify before trusting:
- SessionBuilder.build and restore both reach one private assemble, and the
  target is a parameter each caller decides. The whole design rests on that
  seam, so confirm it before moving anything.
- PluginScope holds the App and is where App-derived readers are built.
  Confirm before adding ActiveNote to it.
- SessionBuilder holds an EngineFactory and not a PluginScope. Confirm, since
  the design has it take an ActiveNote rather than the scope.
- main.ts has no tests, and SessionBuilder does, with a fake app whose
  FakeWorkspace already answers getActiveFile. Confirm both: the design moves
  the binding decision so it becomes testable.
- Nothing but bindOrAskRebind reads view.boundNoteName in production. Confirm
  before deleting either.

Two checks the suite cannot make, both against a real vault:
- Reproduce the report: run a turn, close the panel, open another note, reopen
  the panel, speak an instruction naming that note. The edit lands on it.
- Then read the turn's steps. If the model still re-runs the note-opening
  command from the earlier turn, say so and stop: CommandSection is a separate
  change, and the design says why.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it. Leave finished work in the tree without committing; Ilya chooses the
grouping and the message.
```
