---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Record a retarget where a person and the model can see it, specified in
docs/spec/2-active/recording-a-retarget.

Read 1-index.md, 2-requirements.md, 5-tasks.md, then 3-design.md before commit
1. 4-decisions.md holds why this is not a queued turn.

Load the code-generation and code-unit-tests skills before the first commit.
Repo conventions are in docs/AGENTS.md. Read it before the first commit, and
again for the rule that a prompt change is a behaviour change.

EditEngine.followActiveNote already takes string or null, so both commits can
start now. The sibling spec touches the same method; rebase rather than assume
its shape.

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
