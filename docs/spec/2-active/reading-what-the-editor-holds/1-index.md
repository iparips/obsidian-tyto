---
created: 2026-09-16
updated: 2026-09-16
---

# Reading What The Editor Holds: Spec

read_note and the note context answered the same question differently in one
request, and the model spent a turn trying to reconcile them. One reads the file,
the other the editor.

The resolve that made them diverge in the reported session is fixed. What
remains is that an unsaved editor and its file disagree, so the two can still
part.

- [2-requirements.md](2-requirements.md) - the two sources, and why the open note is the case that matters
- [3-decisions.md](3-decisions.md) - where a read of the open note comes from, and whether grep follows
- [7-transcript.md](7-transcript.md) - the two answers, in one request

No design or tasks file yet. D1 is blocking: it decides whether NoteReader gains
a collaborator or the prompt gains a line.

Downstream of
[following-the-user-mid-turn](../following-the-user-mid-turn/1-index.md), which
fixed the resolve and left this.
