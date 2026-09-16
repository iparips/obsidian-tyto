---
created: 2026-09-16
updated: 2026-09-16
---

# Unit Tests

One entry per production method the design changes. The checks a person runs by
hand are in [7-acceptance-criteria.md](7-acceptance-criteria.md).

<<<<<<< Updated upstream
## NoteEditor.apply
=======
## TargetNoteWriter.write
>>>>>>> Stashed changes

```text
the editor still shows the target path
  writes through the editor, as today
<<<<<<< Updated upstream
  focuses the edit
the tab has moved to another note
  writes through the vault, not the editor
  leaves the note the tab now shows untouched
  does not focus, since the note is not on screen
the target has no editor at all
  writes through the vault
=======
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
>>>>>>> Stashed changes
```

The second case is the reported defect. It fails today by writing into the note
the tab moved to, which is the one thing the rules forbid.

<<<<<<< Updated upstream
=======
## TargetNoteWriter.read and focusEdit

The same comparison, serving the two other reads of the held editor.

```text
reading the target
  reads the editor while the tab still shows it
  reads the file once the tab has moved
focusing the edit at the end of a turn
  moves the cursor while the tab still shows the target
  leaves the cursor alone once the tab has moved
```

>>>>>>> Stashed changes
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

## PanelReducer.reduce

```text
an utterance arrives
  opens a turn holding it
  the turn takes the session's note as its target
<<<<<<< Updated upstream
a step is published
  joins the open turn without scanning back for a user entry
a tool moves the target
  the open turn names the new note
  an earlier turn keeps the note it had
a retarget the user made
  stays a sibling, since it belongs to no turn
a restored session then takes a step
  the step joins the new turn, not the one above the restore marker
```

=======
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

>>>>>>> Stashed changes
The last case is the defect archived spec 33 fixed by offsetting counters. A
container fixes it by construction, so the test moves here and the offsets can
go.

<<<<<<< Updated upstream
## TranscriptTurn.split

```text
entries holding turns
  reads each turn rather than grouping by user entry
  keeps what precedes the first turn as siblings
=======
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
>>>>>>> Stashed changes
```

## PanelHeader

```text
the header
  offers Copy and Reset
  names no note
```
<<<<<<< Updated upstream
=======

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
>>>>>>> Stashed changes
