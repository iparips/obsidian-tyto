---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

Four commits. The first two are the fault and can ship without the rest; the
last two are the panel and depend on each other.

## Commit 1: a write reaches the note by path

- TargetNoteWriter (note-editing, new) owns where a write lands. It asks
  WorkspaceNoteLocator for the editor showing that path now, and the same handle
  the turn holds means the tab has not moved, so the write goes through the
  editor as today
- A different handle, or none, means the tab moved, so the write goes through
  Vault.process and skips focusEdit
- An Editor does not name its file, which is why the locator answers rather than
  the editor
- NoteEditor works the new content out and writes nothing, so plan replaces
  apply and returns a NoteWrite (note-editing, new). Vault.process takes the
  whole note where an editor takes a range, and the same plan serves both
- Vault.process is async, so the write is too, and NoteEditTool.applyOperation
  awaits it
- The whole-note guard reads the target through the writer rather than off the
  held editor. On a moved tab it was comparing the model's read against the note
  the tab moved to
- TurnEndingService focuses the last edit through the writer for the same
  reason: a tab that moved would scroll the note it moved to
- The note context message reads the target through the writer too, so the model
  is never shown another note's content under the target's path. ModelRequest
  holds NoteDetails rather than an OpenNote, which removes the handle
  PromptFactory was reaching through

This is the reported defect and the one that corrupts notes. It ships alone if
the rest waits.

Tests: the editor branch writes as today, the moved-tab branch writes through
the vault and leaves the note now shown untouched, and a target with no editor
takes the vault.

## Commit 2: a read of the turn's note comes from its editor

- TurnState widens by one readonly field for the target note: readNote takes
  that interface already, and it carries three repositories and no note
- HarnessToolsService.readNote answers from the turn's editor where the path is
  the turn's target and the tab has not moved
- Every other path, and a moved tab, answers from NoteReader as today
- NoteReader is untouched, and grep is untouched per D2

Tests: the turn's note answers with unsaved text, a moved tab falls back to the
file, another note reads as today.

## Commit 3: a turn becomes a container

- PanelEntry gains a turn kind holding the utterance, the target and its entries
- PanelReducer opens a turn on the transcript action, taking the session's note
  as the target, and appends to the open turn thereafter
- openStepsAt goes, so nothing scans back to a user entry. withStep stays,
  appending into the open turn rather than into the list
- PanelItem is a turn or a loose entry, which is what the panel holds at the top
  level. PanelState gains flattened and mapEntries, so a reader that does not
  care about grouping sees the entries in order
- PanelReducer moves to its own file: panel-state.ts holds the shape and was
  already over the size limit
- A retarget stays a sibling, per archived spec 32
- TranscriptTurn.split reads turns rather than inferring them, and before()
  stays
- SESSION_SNAPSHOT_VERSION moves, so a record in the flat shape is discarded

Tests: the reducer cases in 6-unit-tests.md, and the restored-session one that
moves here from the offset fix.

## Commit 4: the target is what a turn says about itself

- PanelHeader loses name and path, keeping Copy and Reset
- useTargetNote stays and narrows to the path. It is what supplies the session's
  note when a turn opens, which is D5's starting target
- HistoryTurn (session/views, new) renders the target then the turn's entries,
  so HistoryEntry keeps the eleven kinds unchanged
- The turn renders its target first
- A tool moving the target updates the open turn, through its own action rather
  than the retargets channel, which also carries the user's moves

Tests: the header names no note, and a turn names the target it holds.

The checks a person runs are in
[7-acceptance-criteria.md](7-acceptance-criteria.md).
