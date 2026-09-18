---
created: 2026-09-16
updated: 2026-09-16
---

# Reaching A Note By Path

## Motivation

A turn asked read_note for the shopping list and was told its contents. The note
context sent on the same request said the note held something else entirely. The
model read both, could not reconcile them, and called read_note five more times
before spending the turn on a refusal loop.

The immediate cause was a resolve reading the session back, fixed separately.
What remains is that the two answers come from different places and can still
disagree.

## In Scope

### The reading tools read the file, the note context reads the editor

NoteReader.read calls vault.cachedRead and NoteContextMessage builds from
editor.getValue, so one returns the file and the other the editor. Obsidian
writes an editor to disk on its own schedule, so they differ while an edit is
unsaved.

| Source       | Reads            | Sees an unsaved edit |
| ------------ | ---------------- | -------------------- |
| Note context | editor.getValue  | Yes                  |
| read_note    | vault.cachedRead | No                   |
| grep_notes   | vault.cachedRead | No                   |

A model given both in one request cannot tell which is current. The note context
asserts it supersedes every earlier copy, which is true of the conversation and
says nothing about a tool result arriving beside it.

The turn's note is where this bites, per the second rule: a read of it that
returns the file can hand the model an anchor that no longer exists, or hide one
that does.

### An edit writes through a handle that can move

TargetNoteResolver resolves a path to the Editor of whichever leaf shows it, and
the turn holds that handle for its whole life. Obsidian gives an editor to a
leaf rather than to a file, so the user switching tabs leaves the same handle
showing a different note. The write follows the handle.

Two reported sessions put an item into a note nobody named. The second did it
after the resolve was corrected, so the handle is what remains. Its own comment
anticipated half of this, saying an editor handle would go stale when the tab
closed. It goes wrong when the tab merely changes, and wrongly rather than
loudly.

### The panel shows the session's note, never the turn's

PanelHeader is given one note, and it is the session's. A turn resolves its own
and can hold a different one: a command opens a note mid-turn, or the user moves
while the turn runs, and from then on the header names one note and the edits go
to another.

Nothing says so. Both reported sessions were found by opening the file rather
than the panel: in the second, every step named todo.md while the write landed
in shopping-list.md.

The header is one note with no turn attached to it, so it cannot say which
utterance that note belongs to. A target is a fact about a turn: determined by
it, written through by it, and meaningless once it ends.

So the note leaves the header and the turn part of the panel is redesigned
around its target. That reaches further than a field: a turn is not a container
today, and the eleven entry kinds are flat siblings grouped by scanning back to
the last user entry.

## Steps to Replicate

The reads. Open a note, type into it without saving, and ask a question that
makes the model call read_note on that note. The result and the note context
disagree by whatever was typed.

The write. Ask for an edit to a note the session is not on, so a tool opens it,
and switch tabs while the turn runs. The edit lands in the note now shown rather
than the one the tool opened.

## References

### Task

- [src/search/note-reader.ts](../../../../src/search/note-reader.ts) - open first: read calls cachedRead, which is where the file is preferred
- [src/model/prompt/note-context-message.ts](../../../../src/model/prompt/note-context-message.ts) - builds from the editor, and asserts it supersedes what came before
- [src/engine/note-binding/workspace-note-locator.ts](../../../../src/engine/note-binding/workspace-note-locator.ts) - findEditor, which reads the leaf showing a path rather than the file
- [src/engine/note-editing/note-editor.ts](../../../../src/engine/note-editing/note-editor.ts) - the four editor calls a write makes, two of them cosmetic
- [src/search/note-grep.ts](../../../../src/search/note-grep.ts) - the second reader, so a fix has two call sites rather than one
- The reported session's transcript - removed: held personal vault content

### Project

- [following-the-user-mid-turn](../2026-09-16a-following-the-user-mid-turn/1-index.md) - fixed the resolve that made the two diverge here, and left this
