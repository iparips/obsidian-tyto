---
created: 2026-09-11
updated: 2026-09-11
---

# Implementation Prompt

Paste the block below to a fresh agent. It is a file rather than a section of
[1-index.md](1-index.md) so it can be pasted whole, and it points at the spec
rather than repeating it: anything restated here is a third place to drift.

```text
Implement session persistence, specified in docs/spec/22-session-persistence/.

Read 1-index.md, then 2-requirements.md, then 5-implementation-order.md, which
is the build order: two commits, each leaving the suite green. Read
3-component-design.md before commit 1 and keep it open through commit 2, since
the restore wiring is specified there rather than in the build order. Read
4-testing-strategy.md before writing tests for either commit.

Repo conventions are in docs/AGENTS.md, and the branching rules in CLAUDE.md.

Three claims are about code that may have moved since the spec was written.
Check each rather than trusting it:

- That TranscriptRepository.historyStart returns 0 for a session's first
  recorded step. The seeding in commit 2 exists only because of this, so if it
  has changed, the seeding may be unnecessary or may need a different value.
- That noteNameOf is still module-private in useTargetNote.ts with one caller,
  since the spec has restore reuse it.
- That AskedEntries.turnEnded still carries the phase through unchanged. The
  spec has restore set idle separately because of this.

The end-to-end check is a judgement the suite cannot make, and needs a phone:
run two turns, background the app until Obsidian reloads, and confirm a
follow-up referring to the first turn reaches a model that has the context. The
desktop cannot show this, because a session there is never evicted.

If the spec turns out to be wrong about the code, say so and update the spec
rather than working around it.
```
