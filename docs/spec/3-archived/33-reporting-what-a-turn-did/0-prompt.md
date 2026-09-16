---
created: 2026-09-16
updated: 2026-09-16
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Build the spec in docs/spec/2-active/reporting-what-a-turn-did: three reporting
defects found in two session transcripts, fixed in three independent commits.

Read 1-index.md, 2-requirements.md and 3-decisions.md first, then 7-tasks.md
for the build order. Read 5-design.md and 6-unit-tests.md immediately before
commit 1, the commit they mostly describe. 8-transcripts.md is evidence rather
than instruction: read it only if a defect stops making sense.
4-acceptance-criteria.md holds the checks a person runs afterwards.

Repo conventions are in docs/AGENTS.md, including the rule that a prompt change
is a behaviour change. Nothing here changes a prompt, but commit 1 removes a
message the model used to read, which 4-acceptance-criteria.md has you check by
hand.

Verify three claims before trusting them. ToolDispatcher already holds
HarnessToolsService, which exposes getToolCallSchemas, so commit 2's guard should
need no new dependency; confirm the offered set is reachable from the dispatcher
without one. SessionSnapshotFactory filters only the restored entry kind, which
is what lets a retarget entry persist unchanged. TranscriptTurn.split drops
entries before the first user entry, which is the gap commit 1 closes.

Two things the unit suite cannot judge. After commit 1, run a session where the
model opens a note by command mid-turn and confirm the turn finishes rather than
answering 400. Then retarget between turns and give an instruction naming no
note, confirming the edit lands on the note now in front of you: that is the
check that the removed history message was carrying nothing NoteContextMessage
already carries. If it lands on the previous note, stop and say so, because D1
falls back rather than the fix being patched.

D4 in 3-decisions.md is open and deliberately so. Answer it if commit 2 makes
the answer obvious; otherwise leave it.

If the spec is wrong, fix the spec and say what changed. Do not build around it.
```
