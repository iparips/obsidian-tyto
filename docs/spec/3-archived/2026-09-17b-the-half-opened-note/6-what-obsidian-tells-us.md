---
created: 2026-09-17
updated: 2026-09-17
---

# What Obsidian Tells Us

Why the comparison in [4-decisions.md](4-decisions.md) is the only check
available, and where it is blind. From the typings shipped with the plugin, not
from a running vault, so a probe can overturn it.

## Nothing announces a finished load

No event fires when a view finishes loading a file. file-open reports the active
file, which OpenedNoteWait already listens to, and editor-change is the user
typing. onLoadFile is the real moment but a hook a view implements, not
something a plugin can await.

Asking the view its file is what the locator already does: findEditor matches on
`view.file?.path`, and that field is the one set early. The view answers
truthfully and too soon.

A view gives three answers, settling at different moments.

| Source        | Is                               | Settles           |
| ------------- | -------------------------------- | ----------------- |
| view.file     | the file it intends to show      | early, torn state |
| view.data     | in-memory text, TextFileView     | on load           |
| getViewData() | documented as reading the editor | with the editor   |

## An editor does not know its note

The Editor class carries text, cursor, selection, scroll and undo, and nothing
naming a file. The association runs view to editor and never back:
MarkdownFileInfo pairs the two and editor-change hands both over, but from a
handle alone there is no path to read.

That is what makes the mismatch possible, and it rules out asking the handle
which note it is on.

## Two states a comparison cannot separate

Unsaved edits are the smaller. TextFileView documents requestSave as a debounced
save two seconds out, called as the user types, and a view saves when it unloads
a file. So the legitimate disagreement is about two seconds wide, on a note
being actively typed into, which is not a note a command just opened.

An empty note is sharper, and no timing bounds it. An unloaded editor and an
empty note both read as the empty string, so the check cannot tell them apart.
A note a command creates is exactly this.

Neither breaks the guard: disagreement sends the read to the vault, which holds
the right content either way. The cost is an empty note reading from the vault
when the editor would have done, and a note typed into seconds ago doing the
same. Both are correct answers reached the slower way.
