---
created: 2026-09-17
updated: 2026-09-17
---

# The Half-Opened Note

## Motivation

A turn was asked to add items to the shopping list. A command opened it, and the
model was shown a different note's body under the shopping list's path. It
declined to write, saying the note looked like a session transcript.

It was right. The note context named `Week-38/shopping-list.md` and carried the
body of `Week-38/09-13-tyto-error.md`, opened earlier in the session.

The model noticing is luck. Two similar notes would have gone through, writing
one into the other with nothing in the panel saying so.

## In Scope

### A path and a body that name different notes

The note context comes from one OpenNote, pairing an editor handle with a path.
The path is printed from the pair, the body read through the handle, and nothing
checks they agree.

The transcript shows it. Steps 1 and 2 sent the tyto-error path with its own
body. Step 3 sent the shopping list path with the same body: the recorded diff
changes the path line and nothing else.

### The vault fallback is bypassed, not defeated

TargetNoteWriter already handles a moved tab. tabStillShows compares the handle
the turn holds against the editor the locator finds for the path, and a mismatch
sends the read to the vault.

That guard sees nothing here. The locator matches a view by its own file path,
so for it to return the turn's handle, the view must be reporting the target's
path while its editor still holds the previous note's text.

### A view is editable before it holds the note

`executeCommandById` returns when the command starts. OpenedNoteWait covers the
gap, resolving when a leaf reports the path with an editor present:

```ts
.some((view) => view.file?.path === path && Boolean(view.editor))
```

Both are true the moment Obsidian points the view at the new file, before it
loads that file into the editor. The resolver captures the handle in between,
and the handle is held for the turn, so every later step inherits the wrong body.

## Steps to Replicate

Not reproduced on demand, and the timing is unknown. The reported session is the
evidence, so a probe comes before a fix.

The shape to attempt, on mobile first, where OpenedNoteWait's comment says the
open race is lost most often:

1. Open a note with a long body, so a wrong one is obvious.
2. Start a session on another note.
3. Ask for an edit to a third note a listed command opens.
4. Copy the transcript and compare each note context's path against its body.

## References

### Task

- [src/commands/opened-note-wait.ts](../../../../src/commands/opened-note-wait.ts) - open first: hasEditor, which settles on a view that has the path but may not hold the note
- [src/engine/note-editing/target-note-writer.ts](../../../../src/engine/note-editing/target-note-writer.ts) - getDetails and read, where the comparison goes, and the vault fallback it reuses
- [src/engine/note-binding/target-note-resolver.ts](../../../../src/engine/note-binding/target-note-resolver.ts) - captures the handle the turn then holds
- [src/engine/note-binding/workspace-note-locator.ts](../../../../src/engine/note-binding/workspace-note-locator.ts) - finds an editor by path, and would answer what a view displays
- [src/test-support/fake-note-locator.ts](../../../../src/test-support/fake-note-locator.ts) - a path-to-editor map, with no notion of a view that has not caught up

### Project

- [reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md) - gave the write the vault fallback this reuses
- [naming-what-a-turn-touched](../../2-active/2026-09-17-naming-what-a-turn-touched/1-index.md) - the edit line this reuses, whose wording names a cause that is now one of two

### Architecture

- [architecture/6-reaching-a-note.md](../../../architecture/6-reaching-a-note.md) - how a turn reaches the note it writes to
