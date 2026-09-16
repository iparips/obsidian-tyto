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

Neither was visible. The panel names the session's note and has no way to say
what the running turn is writing to, so both faults were found by opening the
file rather than by reading the panel.

One rule holds the spec together: a target is set by the user before a turn, or
by the model during one, and by nothing else. Every defect here is that rule
failing.

- [2-requirements.md](2-requirements.md) - the two sources, the handle that moves, and the note the panel cannot name
- [3-decisions.md](3-decisions.md) - what an edit writes through, and where a read of the turn's note comes from
- [3-decisions-showing.md](3-decisions-showing.md) - where the user learns which note a turn is writing to
- [7-transcript.md](7-transcript.md) - the two answers, in one request

A write goes through the editor where it still shows the path the tool named,
and through the vault where it does not. The common case keeps undo and the
cursor; only a tab that moved falls back, which is the case that is silently
wrong today.

A read of the turn's note comes from the editor it holds, every other note from
the file, which is D1 and the same principle as D3 from the reading side.

No design or tasks file yet. D4 is the last blocking one: whether the header
keeps a note at all, or a target becomes a per-turn fact. Its answer is chosen
and what remains is whether losing the before-you-speak answer costs anything. One fact is still outstanding:
whether a vault write lands in the editor's undo stack when the note is open.
That decides how loudly the fallback should announce itself, not which option
to take.

Downstream of
[following-the-user-mid-turn](../following-the-user-mid-turn/1-index.md), which
fixed the resolve and left this.
