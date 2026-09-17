---
created: 2026-09-17
updated: 2026-09-17
---

# Tasks

Three commits, independent of each other. Each is worth shipping alone, and the
third is the one a user is currently missing most.

## Prerequisite

Every class below was introduced by
[reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/8-tasks.md) and
the rename that followed it. ProgressLine, TargetNoteWriter, EntryProgress,
HistoryTurn and PanelReducer do not exist before those land, so check they are
in the tree before starting: a clone that lacks them needs that spec built
first.

## Commit 1: the panel stops narrating the user's moves

- useEngineEvents forwards a tool's move to the open turn and drops the user's,
  so the retargeted dispatch goes
- The retargeted entry kind goes, and with it RetargetedText, the retargeted
  action, its entry weight row, its CSS class and its transcript line
- The retargets channel and byUser stay: useTargetNote reads the channel for the
  next turn's target, and the engine still has two callers to tell apart
- SESSION_SNAPSHOT_VERSION moves, since removing a kind changes the record
  shape. The prerequisite already moved it to 2, so this is 3

Tests: the reducer cases in [7-unit-tests.md](7-unit-tests.md).

## Commit 2: a progress line names the note it touched

- ProgressLine gains a note field, and read, opened and edited pass their path
  into it rather than into the detail text
- Every other factory passes none
- ProgressLineReport carries the note across the publisher boundary, and the
  progress entry holds it per line
- HistoryTurn renders the progress entry itself rather than routing it through
  HistoryEntry, since only the turn holds the target the comparison needs.
  HistoryEntry keeps every other kind and gains no parameter
- EntryProgress takes the target beside the lines, and names a line's note only
  where the two differ
- The comparison is the view's, so a restored session shows what it showed

Tests: the ProgressLine and EntryProgress cases.

## Commit 3: a vault write says so

- ApplyResult's applied state carries which path the write took
- TargetNoteWriter sets it on both branches
- ToolCallOutcome.edited takes it, so the factory still sets the paired fields
  together rather than leaving a call site to set one without the other
- NoteEditTool passes what the writer returned into that factory
- recordEdit publishes a warning beside the edit line where the path was the
  vault, through the channel the step budget already uses
- runningLowFn becomes warnedFn, since it now has two callers and was named for
  the first

This is the one that matters to a user: an edit their editor cannot undo, which
they were never told about.

Tests: the TargetNoteWriter and recordEdit cases.

The checks a person runs are in
[5-acceptance-criteria.md](5-acceptance-criteria.md). One of them is blocked on
nothing, and the other two need a real vault.
