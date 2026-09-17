---
created: 2026-09-17
updated: 2026-09-17
---

# Where the Check Sits

tabStillShows (TargetNoteWriter) becomes async and gains a second question. The
name stops describing it, so it is renamed to editorHoldsTheNote.

```ts
// A tab that moved answers with another handle. A tab that has not finished
// loading answers with this one and holds the previous note's text, so the
// handle is trusted only where the two agree.
private async editorHoldsTheNote(note: OpenNote, wroteThroughEditor: boolean): Promise<boolean> {
  if (!this.tabShowsPath(note)) return false
  if (wroteThroughEditor) await this.noteLocator.saveOpenNote(note.path)
  return note.editor.getValue() === (await this.readFile(note.path))
}
```

readFile (TargetNoteWriter, new) is the vault read that write and read already
do, lifted out of both so the comparison and the fallback share one path. It
returns the empty string where the path is not a note, which is what read
returns today.

Both write and read then await it, and their bodies are otherwise unchanged.
getDetails passes the flag through to read.

wroteThroughEditor is the turn's own record for this path. It decides whether
the view may be flushed before the comparison, which
[5-the-dirty-editor.md](5-the-dirty-editor.md) owns.

## Focus Cannot Await

focusEdit (TargetNoteWriter) is called from turn-ending-service.ts:31 after the
turn's last step, and returns void. Making it async would push a promise up
through TurnEndingService for no gain: focusing the wrong note scrolls a tab,
where reading it corrupts a note.

It keeps the handle-identity test alone, under its own name.

```ts
// Scrolling asks the cheaper question. A tab that moved must not be scrolled;
// a tab still loading is about to show this note anyway, so a scroll into it
// is at worst early.
focusEdit(note: OpenNote, position: EditorPosition): void {
  if (this.tabShowsPath(note)) this.noteEditor.focusEdit(note.editor, position)
}
```

That leaves two predicates with names saying which question each asks, rather
than one name that was true of both.
