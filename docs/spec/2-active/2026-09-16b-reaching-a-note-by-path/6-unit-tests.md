---
created: 2026-09-16
updated: 2026-09-17
---

# Unit Tests

One entry per production method the design changes. The checks a person runs by
hand are in [7-acceptance-criteria.md](7-acceptance-criteria.md).

## TargetNoteWriter.write

```text
the editor still shows the target path
  writes through the editor, as today
  reports where the edit ended, so the turn can focus it
  refuses an anchor the note does not hold
the tab has moved to another note
  writes through the vault, not the editor
  leaves the note the tab now shows untouched
  does not move the cursor, since the target is not on screen
  refuses an anchor the file does not hold, leaving the target unchanged
the target has no editor at all
  writes through the vault
  refuses when the vault has no note at the path
```

The second case is the reported defect. It fails today by writing into the note
the tab moved to, which is the one thing the rules forbid.

## TargetNoteWriter.read, getDetails and focusEdit

The same comparison, serving the three other reads of the held editor.

```text
reading the target
  reads the editor while the tab still shows it
  reads the file once the tab has moved
describing the target for the model
  describes the editor while the tab still shows it
  describes the file once the tab has moved
focusing the edit at the end of a turn
  moves the cursor while the tab still shows the target
  leaves the cursor alone once the tab has moved
```

getDetails is what the note context message carries, so the path and the
content it pairs come from the same note.

## HarnessToolsService.readNote

```text
the path is the turn's target
  answers from the editor the turn holds
  answers with an unsaved edit the file does not have
the path is the turn's target but the tab has moved
  answers from the file
the path is another note
  answers from the file, as today
```

The second leaf is stale rather than wrong, which is the trade D1 named: the
turn's writes take the vault branch there anyway.

## The note context message

Through the engine rather than on ModelService, since what matters is the
message the provider was handed.

```text
the tab still shows the target
  shows the model what the editor holds, unsaved text and all
the tab moves to another note mid-turn
  shows the model the target, from the file the tab left behind
  never shows the model the content of the note the tab moved to
  keeps the target path on the message, so the content still names it
```

The path was always right, which is what made the defect silent: the model was
shown another note's content under the target's name.

## PanelReducer.reduce

```text
an utterance arrives
  opens a turn holding it
  the turn takes the session's note as its target
  carries no target when the session is on no note
a step is published
  joins the open turn without scanning back for a user entry
a retarget the user made
  stays a sibling, since it belongs to no turn
  leaves the open turn holding only what it produced
a restored session then takes a step
  the step joins the new turn, not the one above the restore marker
  the restored turn keeps what it held
```

A tool moving the target is asserted through the panel, where the turn is
rendered, rather than on the reducer alone.

The last case is the defect archived spec 33 fixed by offsetting counters. A
container fixes it by construction, so the test moves here and the offsets can
go.

## TranscriptTurn.split and before

```text
splitting the entries the panel holds
  reads one turn per turn, rather than grouping by user entry
  numbers the turns in the order they were shown
  leaves an entry belonging to no turn out of every turn
  reads no turn from a panel that holds none
reading what precedes the first turn
  keeps the entries shown before any turn opened
  keeps nothing when the session opens on a turn
```

## PanelHeader

```text
the header
  offers Copy and Reset
  names no note
```

## SessionPanel

Where the turn's target is rendered, so the acceptance criterion has a unit
test under it.

```text
a turn names the note it is writing to
  names the session note the turn started on
  names no note when the session is on none
  names the new note once a tool opens one mid-turn
  leaves an earlier turn naming the note it wrote to
```
