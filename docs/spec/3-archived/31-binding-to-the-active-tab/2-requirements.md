---
created: 2026-09-16
updated: 2026-09-16
---

# Binding To The Active Tab

## Motivation

On mobile, opening a new empty tab left the panel bound to the note in the
previous tab. The session went on editing a note the user was no longer looking
at, and nothing on screen said so.

The rule the codebase already states is that a session is bound to the open
markdown note, or to null when nothing markdown is open. Archived spec
[29-following-the-note-across-a-restore](../../3-archived/29-following-the-note-across-a-restore/1-index.md)
wrote that down and applied it to the two entry points that build a session. The
third path, the file-open subscription that moves a running session, was not
changed and still implements only the first half.

Binding to the wrong note is the failure mode that spec existed to remove: an
instruction lands on a note the user cannot see, and the edit is silent.

## In Scope

- SessionController.retargetActiveEngine unbinds when the active tab holds no
  markdown note, rather than keeping the note it had.
- EditEngine.followActiveNote and SessionRepository.changeTargetNote accept
  null. The latter's comment saying callers can only move a session to a note
  stops being true and goes.
- The retarget channel carries null, so the header stops naming a note the
  session has left. TargetNotePorts.onTargetNoteChanged and Listeners<string>
  type the path as string today.
- A running turn is left alone. There is no note to resolve to once the session
  is unbound.

## Steps to Replicate

1. Open a note on mobile and start a Tyto session. The header names the note.
2. Create a new tab and leave it empty.
3. Speak or type an instruction.

The instruction edits the note from step 1, and the header still names it.

Switching between two tabs that each hold a note does retarget the session, so
the subscription and the retarget path both work. Only the empty tab is dropped.

## References

### Task

- [src/wiring/session-controller.ts](../../../../src/wiring/session-controller.ts) - open first: retargetActiveEngine drops the event
- [src/engine/edit-engine.ts](../../../../src/engine/edit-engine.ts) - followActiveNote, which takes a string
- [src/session/session-repository.ts](../../../../src/session/session-repository.ts) - changeTargetNote, whose comment records the assumption this breaks
- [src/session/views/hooks/useTargetNote.ts](../../../../src/session/views/hooks/useTargetNote.ts) - the header already renders a null name

### Project

- [29-following-the-note-across-a-restore](../../3-archived/29-following-the-note-across-a-restore/1-index.md) - states the binding rule and fixes the two entry points this one misses
- [recording-a-retarget](../32-recording-a-retarget/1-index.md) - the sibling: this spec fixes when a retarget happens, that one records that it did

### Architecture

- [7-package-design.md](../../../architecture/7-package-design.md) - the open note recording that the retarget rule sits in wiring, reads as engine's, and has no test
