---
created: 2026-09-16
updated: 2026-09-16
---

# Recording A Retarget: Spec

A retarget moves the panel header and leaves no other trace. The transcript,
the panel entry list and the model's own history all go without it.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - the three destinations and what each one costs
- [3-design.md](3-design.md) - one step for the panel, one history message for the model and the transcript
- [4-decisions.md](4-decisions.md) - what a retarget reaches, and why it is not a turn
- [5-tests.md](5-tests.md) - four checks, and the one needing a real key
- [6-tasks.md](6-tasks.md) - two commits, one per write, independent of each other

Superseded in part by
[reporting-what-a-turn-did](../33-reporting-what-a-turn-did/1-index.md). Its D1
reverses the model half of D1 and D2 here: a retarget is a session event with
its own panel entry kind, so nothing is appended to the chat history and the
step is gone. What this spec still holds is that a retarget is worth recording
at all, and that a person reading a session back should see when it changed
note.

Two defects came from the two homes this spec chose. A history message can land
between a tool call and its result, which the provider answers with a 400. A
step needs a turn to own it, and a restore leaves the entry the reducer scans
for above the restore marker.

Sibling to
[binding-to-the-active-tab](../31-binding-to-the-active-tab/1-index.md), which
fixes when a retarget happens. This one records that it did.
