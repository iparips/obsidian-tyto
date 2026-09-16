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

Two rules hold the spec together. Only the model moves a running turn's target,
and the editor is authoritative for the note you are editing where the vault is
authoritative for finding notes. Every defect here is one of them failing.

- [2-rules.md](2-rules.md) - what must be true of a target, and where a note's contents come from
- [3-requirements.md](3-requirements.md) - the two sources, the handle that moves, and the note the panel cannot name
- [4-decisions.md](4-decisions.md) - what an edit writes through, and where a read of the turn's note comes from
- [4-decisions-showing.md](4-decisions-showing.md) - the note leaving the header, and whether a turn becomes a container
- [5-design.md](5-design.md) - where a write lands, where a read comes from, and the turn container
- [6-unit-tests.md](6-unit-tests.md) - the unit tests each changed method needs
- [7-acceptance-criteria.md](7-acceptance-criteria.md) - four checks, and the one that needs a moving tab
- [8-tasks.md](8-tasks.md) - four commits, the first two shipping the fault fix alone
- [9-transcript.md](9-transcript.md) - the two answers, in one request
- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it

A write goes through the editor where it still shows the path the tool named,
and through the vault where it does not. The common case keeps undo and the
cursor; only a tab that moved falls back, which is the case that is silently
wrong today.

A read of the turn's note comes from the editor it holds, every other note from
the file, which is D1 and the same principle as D3 from the reading side.

The note leaves the header, and a turn becomes a real container holding its
target, its steps and its reply. That makes the grouping a fact rather than
something scanned back to, which is what put a retarget in the wrong turn once
already.

Every decision is settled and the design is written. A turn starts on the
session's note and shows it, which is what a user relies on when an utterance
names no note at all, and a tool call moving it is the change worth seeing.

The first two commits are the fault and ship without the rest, which matters
because the wrong-note write is live. One fact is still outstanding: whether a
vault write lands in the editor's undo stack when the note is open. Neither the
API nor the typings say, so it needs a keystroke in a running Obsidian. That
decides how loudly the fallback should announce itself, not which option to
take.

Downstream of
[following-the-user-mid-turn](../2026-09-16a-following-the-user-mid-turn/1-index.md), which
fixed the resolve and left this.
