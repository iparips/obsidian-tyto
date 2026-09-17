---
created: 2026-09-17
updated: 2026-09-17
---

# Design Prompt

Paste the block below into a fresh session to design this spec. It asks for the
design, not the build: there is no tasks file yet, and writing one is part of
the work.

```text
Design the spec in docs/spec/2-active/2026-09-17b-the-half-opened-note. A
command opens a note, and the model is shown a different note's body under its
path. Both decisions are settled; what is missing is the design and the tasks.

Read 1-index.md, then 3-requirements.md for the mechanism, then 4-decisions.md.
D1 chose the fix and D2 settled what the panel says, so neither is yours to
reopen. Read 6-what-obsidian-tells-us.md before designing the comparison: it
carries the API findings and the two states the check cannot separate.
5-acceptance-criteria.md holds the checks a person runs afterwards.

Repo conventions are in AGENTS.md, and the sdd skill owns the design and tasks
file shapes. Write 7-design.md and 8-tasks.md.

The spec asserts things about a codebase that has moved today. Verify three
before trusting them. TargetNoteWriter.tabStillShows is said to be what read,
write and focusEdit each consult, which would make it the one place a comparison
has to go; check whether all three reach it, since the write does not go through
read. ProgressLine is said to carry wroteDirect already, with the panel and
transcript wording naming a moved tab as the cause; D2 needs that wording to
cover two causes or name neither. And OpenedNoteWait.hasEditor is said to settle
on a view that reports the path with an editor present, which is the gap the
handle is captured in.

The design must answer one thing the spec only records as a problem: how a test
reaches a half-opened view. The third assumption in 4-decisions.md says why no
fake can build one today. Without an answer the fix ships unverified.

The defect is not reproduced on demand, so treat the reported session as the
only evidence and say what a probe would settle. If the spec is wrong, fix the
spec and say what changed rather than designing around it.
```
