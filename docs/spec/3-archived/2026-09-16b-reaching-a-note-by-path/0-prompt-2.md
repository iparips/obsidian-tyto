---
created: 2026-09-17
updated: 2026-09-17
---

# The Prompt: What Is Left

The four commits in [8-tasks.md](8-tasks.md) are built and committed. One bullet
of commit 1 is not, and this is the block to hand a fresh session for it.

```text
One change is left from docs/spec/3-archived/2026-09-16b-reaching-a-note-by-path.
The other four commits are built; do not rebuild them.

It is the last bullet of commit 1 in 8-tasks.md: the note context message still
reads the editor handle the turn holds, so a tab that moved shows the model
another note's content under the target's path. Read 8-tasks.md commit 1, then
the "Where A Write Lands" section of 5-design.md, and D3 in 4-decisions.md for
why the writer is the one thing that knows whether the tab still shows the
target. A transcript of the reported session was removed: held personal vault content; it stops
making sense.

Repo conventions are in AGENTS.md. Read
docs/architecture/12-the-panel-vocabulary.md before naming anything.

Verify two claims before trusting them. PromptFactory is said to be the only
reader of ModelRequest.note, which is what makes narrowing the field to
NoteDetails safe. And TargetNoteWriter.read is said to answer from the editor
where the tab still shows the target and from the file where it has not, which
is the behaviour the note context needs to inherit.

Two things the spec does not say, both about shape. ModelService.requestForModel
is synchronous and the read is not, though askModel already is, so the await has
somewhere to go. And ModelService does not hold the writer today:
TurnRunnerFactory builds it and already holds one, so it can be passed in rather
than built a second time.

The check that matters cannot be run from the suite: with a note open, ask for
an edit to a different note so a tool opens it, switch tabs while the turn runs,
and read the note context in the copied transcript. It must carry the target's
content, not the content of the tab you switched to. Say you could not run it
rather than claiming it.

If the spec is wrong, fix the spec and say what changed rather than building
around it.
```
