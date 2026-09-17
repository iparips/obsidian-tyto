---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Record a retarget where a person and the model can see it, specified in
docs/spec/2-active/recording-a-retarget.

Read 1-index.md, 2-requirements.md and 6-tasks.md, then 3-design.md before the
first commit. 5-tests.md holds the checks a person runs afterwards, and
4-decisions.md why this is not a queued turn.

Load the code-generation and code-unit-tests skills first. Repo conventions are
in AGENTS.md, including the rule that a prompt change is a behaviour
change.

EditEngine.followActiveNote already takes string or null, so both commits can
start now. The sibling spec touches the same method; rebase rather than assume
its shape.

Verify before trusting:
- TranscriptTurnSection slices the whole chat history, and the gap was in
  rendering rather than slicing. 6-tasks.md records what was found; confirm it
  against the code before building on it.
- SessionProgress.publishStep counts a step against the transcript. Confirm the
  retarget step goes through it rather than beside it.

Commit 2 changes what the model is told, so the unit suite cannot judge it. Do
not run it against a real vault or key. Say in the PR body that it is unverified
and that 5-tests.md names the check a reviewer runs.

If the spec is wrong, say so and fix the spec. Do not build around it.
```
