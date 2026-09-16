---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Record a retarget where a person and the model can see it, specified in
docs/spec/2-active/recording-a-retarget.

Read 1-index.md, then 2-requirements.md, then 5-tasks.md. Read 3-design.md
before commit 1. 4-decisions.md holds why this is not a queued turn, which is
worth reading before changing the approach.

Repo conventions are in docs/AGENTS.md. Read it before the first commit, and
again for the rule that a prompt change is a behaviour change.

Commit 1 touches no file the sibling spec touches and can start now. Commit 2
edits EditEngine.followActiveNote, which binding-to-the-active-tab widens in its
commit 1. Wait for that to land, then build against the widened signature.

Verify before trusting:
- TranscriptTurnSection slices chatHistory by a step's recorded range. Confirm
  a message appended between two turns is in no slice, since closing that gap
  is the commit-2 work.
- SessionProgress.publishStep counts a step against the transcript. Confirm the
  retarget step goes through it rather than beside it.

Commit 2 changes what the model is told, so the unit suite cannot judge it.
Test against a real vault: bind a session, give an instruction, switch to
another note, then give a second instruction naming no note. The second should
land on the note now in front of you. If the model reaches back for the first,
the message is reading as a directive; take commit 2 out, keep commit 1, and
report it.

If the spec is wrong, say so and fix the spec. Do not build around it.
```
