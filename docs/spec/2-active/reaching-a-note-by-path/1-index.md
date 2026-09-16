---
created: 2026-09-16
updated: 2026-09-16
---

# Reaching A Note By Path: Spec

Two faults with one root: the plugin reaches a note through an editor, and an
editor belongs to a tab rather than to a file.

Reading, that means read_note and the note context answer the same question
differently, and a model sent both cannot tell which is current. Writing, it
means the handle a turn holds shows another note once the user switches tabs,
and the edit follows the handle.

- [2-requirements.md](2-requirements.md) - the two sources, the handle that moves, and why the open note is the case that matters
- [3-decisions.md](3-decisions.md) - what an edit writes through, where a read comes from, and whether grep follows
- [7-transcript.md](7-transcript.md) - the two answers, in one request

A write goes through the editor where it still shows the path the tool named,
and through the vault where it does not. The common case keeps undo and the
cursor; only a tab that moved falls back, which is the case that is silently
wrong today.

No design or tasks file yet. D1 is blocking, and one fact is still outstanding:
whether a vault write lands in the editor's undo stack when the note is open.
That decides how loudly the fallback should announce itself, not which option
to take.

Downstream of
[following-the-user-mid-turn](../following-the-user-mid-turn/1-index.md), which
fixed the resolve and left this.
