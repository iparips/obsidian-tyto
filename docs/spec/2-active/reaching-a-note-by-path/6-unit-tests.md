---
created: 2026-09-16
updated: 2026-09-16
---

# Unit Tests

One entry per production method the design changes. The checks a person runs by
hand are in [7-acceptance-criteria.md](7-acceptance-criteria.md).

## NoteEditor.apply

```text
the editor still shows the target path
  writes through the editor, as today
  focuses the edit
the tab has moved to another note
  writes through the vault, not the editor
  leaves the note the tab now shows untouched
  does not focus, since the note is not on screen
the target has no editor at all
  writes through the vault
```

The second case is the reported defect. It fails today by writing into the note
the tab moved to, which is the one thing the rules forbid.

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

The last case is the defect archived spec 33 fixed by offsetting counters. A
container fixes it by construction, so the test moves here and the offsets can
go.

## TranscriptTurn.split

```text
entries holding turns
  reads each turn rather than grouping by user entry
  keeps what precedes the first turn as siblings
```

## PanelHeader

```text
the header
  offers Copy and Reset
  names no note
```
