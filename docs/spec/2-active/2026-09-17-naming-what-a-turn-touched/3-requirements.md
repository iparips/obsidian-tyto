---
created: 2026-09-17
updated: 2026-09-17
---

# Naming What A Turn Touched

## Motivation

A turn added potatoes to the shopping list, wrote them correctly, and then told
the user it could not find the shopping list. The panel showed three notes being
opened that the user had not asked for, and said nothing about a write that had
gone to the file rather than the editor.

Every part of that is the panel and the prompt describing a moving editor to a
model and a user who each needed a fixed one. The write itself was right.

## In Scope

### The panel narrates note switches nobody asked about

The panel ends a turn with a line per note the session passed through:

```text
Now editing 09-14-Mon.
Now editing 09-15-Tue.
Now editing shopping-list.
```

These made sense when the header named one note and a turn could not. A turn now
holds its own target, fixed for its life, so the lines say nothing the turn does
not: they narrate a header that no longer exists.

They are also the wrong grain. The session's note is where the next turn starts,
which is one fact, and three lines saying it moved three times is not that fact.

### A progress line does not say which note it touched

A progress line carries a label and a detail, and the detail is free text. A
read names its path because read() happens to format it in; an applied edit
names its path because the tool result does. Nothing makes the note a field, so
nothing can say a line acted on a note other than the turn's target.

That is the case worth seeing. The reported session read shopping-list.md and
wrote to it, and a reader had to compare two free-text details to know that.

### A write that falls back to the vault is silent

Archived spec [reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md)
gave a write two paths: through the editor while it still shows the target, and
through the vault where the tab has moved. The vault path costs the cursor, and
may cost undo.

Nothing tells the user which path a write took. A user whose editor cannot undo
an edit was never told the edit was made that way.

## Steps to Replicate

The lines. Ask for an edit to a note the session is not on, so a command opens
it, and read the end of the turn: one line per note the session passed through.

The silence. Ask for an edit, switch tabs while the turn runs, and watch the
edit land correctly with nothing saying it went through the vault.

## References

### Task

- [src/session/models/retargeted-text.ts](../../../../src/session/models/retargeted-text.ts) - open first: the three lines, and the only text a retarget entry carries
- [src/engine/progress-line.ts](../../../../src/engine/progress-line.ts) - the label and detail a line holds, and the factories that build one per tool
- [src/engine/note-editing/target-note-writer.ts](../../../../src/engine/note-editing/target-note-writer.ts) - the two write paths, where the fallback is decided and currently unreported
- [src/session/views/EntryProgress.tsx](../../../../src/session/views/EntryProgress.tsx) - the collapsed list, where a line's target would render
- [src/session/views/PanelHeader.tsx](../../../../src/session/views/PanelHeader.tsx) - the toolbar the note left, which now has no name of its own

### Project

- [reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md) - gave the turn its target and the write its fallback, and left both unsaid in the panel
- [architecture/2-vocabulary.md](../../../architecture/2-vocabulary.md) - turn, turn step and progress line, and the entry kinds this spec removes one of
