# Editing the Open Note: Spec

One note is editable at any moment: the note the turn is targeting. The edit
tools carry no path, so the model cannot name a note to write to.

Two fields on TurnRepository withdraw permission from that note once the model
searches. They exist for a case that is not a fault: an edit made after a choice
but before the open lands on the note the user still has in front of them, which
is what an edit means.

What was missing is that the panel never said which note an edit reached. Naming
it there lets the fields go.

A delta on [choosing-the-note](../2026-09-03h-choosing-the-note/1-index.md), whose
consent mechanism this leaves intact and relies on.

- [2-requirements.md](2-requirements.md) - what one note editable means, and what the guard costs
- [3-design.md](3-design.md) - the step that names its note, the fields that go, and the turn following the user
- [4-tasks.md](4-tasks.md) - build order in three commits, with the tests that hold each

Built. The investigation behind it is in
[2026-09-08a-layering/7-what-the-guard-defends.md](../2026-09-08a-layering/7-what-the-guard-defends.md).
