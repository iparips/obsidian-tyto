---
created: 2026-09-11
updated: 2026-09-11
---

# Implementation Prompt

Paste the block below to a fresh agent. It is a file rather than a section of
[1-index.md](1-index.md) so it can be pasted whole, and it points at the spec
rather than repeating it: anything restated here is a third place to drift.

```text
Implement the relative date tool, specified in docs/spec/3-archived/2026-09-11a-relative-date-tool/.

Read 1-index.md, then 2-requirements.md, then 4-tasks.md, which is the build
order: three commits, each standing alone with its tests green. Read
3a-interface.md before commit 1, and 3b-wiring.md before commit 2.

Repo conventions are in AGENTS.md, and the branching rules in CLAUDE.md.

Three claims are about code that may have moved since the spec was written.
Check each rather than trusting it:

- That ToolDispatcher still routes on ToolCall.isHarnessTool, and that the
  predicate is still a hardcoded list of tool names.
- That HarnessToolsService.execute refuses every search tool behind one
  searchEnabled check, which is where resolve_date joins them.
- That TextResult and Refusal still cover a tool returning text, so no new
  HarnessResultKind is needed.

The test plan's dates were measured against chrono-node 2.10.1. If a newer
version resolves any of them differently, pin 2.10.1 rather than changing the
expected dates.

The end-to-end check is a judgement the suite cannot make: on a real vault, say
"find a daily note from last Friday and write, I ate eggs on toast on top of
the note", and confirm the model sends the phrase to resolve_date rather than
a date of its own.

If the spec turns out to be wrong about the code, say so and update the spec
rather than working around it.
```
