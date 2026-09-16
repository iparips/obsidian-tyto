---
created: 2026-09-16
updated: 2026-09-16
---

# Reporting What A Turn Did: Spec

One session claimed an edit was already applied on the turn that applied it.
Another died on an API 400 the user never caused. A third defect was found in
the code behind them: a retarget after a restore lands in the turn above the
restore marker.

The work landed in all three cases. What the model and the user were told about
it was wrong.

Two of the three are one defect. Recording a retarget gave it a panel step and a
history message, and each home fails in its own way. A retarget becomes a session
event instead, the way a restore already is, and both faces go.

- [2-requirements.md](2-requirements.md) - the defects, each reproduced against the tree
- [3-decisions.md](3-decisions.md) - whether a retarget is a session event, and what a refused or applied call tells the model
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - the four checks a person runs, and why the rest are unit-reachable
- [5-design.md](5-design.md) - where each fix sits, and the unit tests that pin it
- [6-unit-tests.md](6-unit-tests.md) - the unit tests each changed method needs
- [7-tasks.md](7-tasks.md) - three commits, and what to land together
- [8-transcripts.md](8-transcripts.md) - the two reported sessions, kept whole because the tool results are the evidence
- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it

Ready for a fresh session. A retarget becomes a session event, a malformed tool
name is refused before dispatch, and an applied edit names the operation and the
note. D4 is open and non-blocking, answerable during the build.

Amending [recording-a-retarget](../recording-a-retarget/1-index.md) is part of
this work: D1 here reverses its D2, and the two should not ship disagreeing.

Downstream of [recording-a-retarget](../recording-a-retarget/1-index.md), which
added the retarget step and the history message that two of the three defects
come from.
