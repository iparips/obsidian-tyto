---
created: 2026-09-16
updated: 2026-09-16
---

# Reading What The Editor Holds

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

NoteReader.read calls vault.cachedRead, which returns what is on disk.
NoteContextMessage builds from editor.getValue, which returns what the editor
shows. Obsidian writes an editor to disk on its own schedule, so the two differ
for as long as an edit is unsaved.

| Source       | Reads            | Sees an unsaved edit |
| ------------ | ---------------- | -------------------- |
| Note context | editor.getValue  | Yes                  |
| read_note    | vault.cachedRead | No                   |
| grep_notes   | vault.cachedRead | No                   |

A model given both in one request has no way to tell which is current. The note
context asserts it supersedes every earlier copy, which is true of the
conversation and says nothing about a tool result arriving beside it.

### The open note is the one case where the editor is authoritative

Every other note the tools read has no editor, so the file is all there is. The
note the session is bound to is different: it has an editor, that editor is what
the edit tools write through, and its contents are what an anchor is matched
against.

So a read of the open note that returns the file can hand the model an anchor
that no longer exists, or hide one that does.

## Steps to Replicate

Open a note, type into it without saving, and ask a question that makes the
model call read_note on that note. The result and the note context disagree by
whatever was typed.

## References

### Task

- [src/search/note-reader.ts](../../../../src/search/note-reader.ts) - open first: read calls cachedRead, which is where the file is preferred
- [src/model/prompt/note-context-message.ts](../../../../src/model/prompt/note-context-message.ts) - builds from the editor, and asserts it supersedes what came before
- [src/search/note-grep.ts](../../../../src/search/note-grep.ts) - the second reader, so a fix has two call sites rather than one
- [7-transcript.md](7-transcript.md) - the reported session, where the two answers sit in one request

### Project

- [following-the-user-mid-turn](../following-the-user-mid-turn/1-index.md) - fixed the resolve that made the two diverge here, and left this
