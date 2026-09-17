---
created: 2026-09-16
updated: 2026-09-16
---

# Unit Tests

One entry per production method the design changes. The checks a person runs by
hand are in [4-acceptance-criteria.md](4-acceptance-criteria.md).

## EditEngine.followActiveNote

```text
a turn is running
  moves the session target
  reports the move on the retargets channel
  leaves the running turn writing to the note it started on
  appends nothing to the chat history
no turn is running
  moves the session target for the next turn to resolve
the note opened is the one already targeted
  reports nothing
```

The third case is the regression test. It fails today, since retargetRunningTurn
swaps the note under the turn.

## ToolCallExecutor.executeToolCalls

```text
one edit call in the batch
  applies it
a second edit call in the same batch
  refuses it without reaching the dispatcher
  names the step boundary rather than the anchor
  applies the first
an edit call after a search call
  applies the edit, since only edits count against the boundary
a second edit in the next step
  applies it, since the count is per step
three edits in one batch
  refuses the second and the third
  does not end the turn, since the boundary is not a repeated refusal
```

The last case is the one that bites. RepeatedRefusalCounter ends a turn after two
identical refusals, so a boundary refusal recorded against it would turn a
three-edit batch into a stuck turn.

## NoteEditTool.execute, for a whole-note write

```text
the note was not read this turn
  refuses, naming the read rather than the content
the note was read and has not changed
  the user confirms
    replaces the whole note
    reports the operation and the note, as an anchored edit does
  the user declines
    writes nothing
the note changed since the model read it
  refuses, naming that the note moved
  refuses before asking the user, so no confirmation is spent on a stale write
```

The last leaf is the ordering the design states: the two refusals come before
the confirmation, so a user is only asked about a write that is current.

## NoteEditor.apply

```text
a whole-note operation
  replaces the note from offset zero to its length
  reports where the write ended, as the anchored kinds do
```

## NotesReadRepository

```text
a note read this turn
  is recorded
  a different note is not
nothing read
  holds no note
```

## ModelsRole.build

```text
the prompt
  says a scattered edit is one whole-note write
  no longer asks for a batch of edits applied in order
  says why the boundary exists, so a refusal reads as the rule
```

A prompt change this repo treats as a behaviour change, so these assert the text
and 4-acceptance-criteria.md carries the judgement.
