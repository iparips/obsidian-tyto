---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

Four commits. The first two are the fault and can ship without the rest; the
last two are the panel and depend on each other.

## Commit 1: a write reaches the note by path

- NoteEditor.apply takes the target path and asks WorkspaceNoteLocator for the
  editor showing it now. The same handle the turn holds means the tab has not
  moved, so the write goes through the editor as today
- A different handle, or none, means the tab moved, so the write goes through
  Vault.process and skips focusEdit
- An Editor does not name its file, which is why the locator answers rather than
  the editor

This is the reported defect and the one that corrupts notes. It ships alone if
the rest waits.

Tests: the editor branch writes as today, the moved-tab branch writes through
the vault and leaves the note now shown untouched, and a target with no editor
takes the vault.

## Commit 2: a read of the turn's note comes from its editor

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
- withStep and openStepsAt go, and the restore offsets archived spec 33 added go
  with them: a container fixes by construction what they patched
- A retarget stays a sibling, per archived spec 32
- TranscriptTurn.split reads turns rather than inferring them, and before()
  stays
- SESSION_SNAPSHOT_VERSION moves, so a record in the flat shape is discarded

Tests: the reducer cases in 6-unit-tests.md, and the restored-session one that
moves here from the offset fix.

## Commit 4: the target is what a turn says about itself

- PanelHeader loses name and path, keeping Copy and Reset, and useTargetNote
  goes with it
- The turn renders its target first
- A tool moving the target updates the open turn, through its own action rather
  than the retargets channel, which also carries the user's moves

Tests: the header names no note, and a turn names the target it holds.

The checks a person runs are in
[7-acceptance-criteria.md](7-acceptance-criteria.md).
