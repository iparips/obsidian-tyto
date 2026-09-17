---
created: 2026-09-17
updated: 2026-09-17
---

# The Dirty Editor

D1 compares the editor against the file. A write through the editor makes the
two disagree, so without an answer the guard turns every edit after the first
into a vault write of stale text.

## What Breaks Without It

TextFileView saves two seconds after a change and the plugin forces no save, so
a turn's steps run inside that window. Edit 1 goes through the editor. Edit 2
compares, sees a mismatch, reads a file that is still missing edit 1, and writes
that text back through the vault.

| Copy   | Holds              |
| ------ | ------------------ |
| Editor | edit 1, not edit 2 |
| File   | edit 2, not edit 1 |

Obsidian's save then puts the editor over the file, and edit 2 is gone. The
panel also warns that undo is unavailable on every edit after the first, which
is untrue.

## The Flush

The comparison saves the view first, so the file catches up and the two agree
over text the file was only behind on. A half-opened view has nothing of its own
to save, so it still disagrees and is still caught.

## The View It Must Never Flush

TextFileView.save writes getViewData, the editor's text, to view.file. In a
half-opened view, view.file is already the target and the editor still holds the
previous note, so a flush writes the previous note's body over the target. That
is the corruption the guard exists to prevent, performed deliberately.

So only a view this turn already wrote through is flushed. It passed the whole
trust test to earn that write, which is what says it was loaded; flushing it
writes back what it was trusted with.

## Where The Record Lives

TargetNoteWriter is session-scoped and holds no state, and EngineFactory builds
two of them. So the record is turn-scoped, on TurnRepository beside the paths a
turn wrote, and travels to the writer as a boolean parameter rather than as a
collaborator. TurnState carries it to the tools, the way it carries the paths a
search returned.

| Caller                                          | Reads the record from |
| ----------------------------------------------- | --------------------- |
| NoteEditTool, for write and read-before-rewrite | TurnRepository        |
| ModelService, for the note context              | TurnRepository        |
| HarnessToolsService, for read_note              | TurnState             |

NoteEditTool also writes it, on the step that wrote through the editor, so the
call and the record it must leave sit in one method.

## What This Does Not Fix

Text the user typed and Obsidian has not saved. The turn did not write it, so
the view is not flushed and the read takes the vault. That is D1's accepted
cost, unchanged: the disagreement is two seconds wide and closes on its own.
