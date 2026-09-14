---
created: 2026-09-14
updated: 2026-09-14
---

# Implementation Prompt

The block to paste into a fresh session that will build this spec.

```text
Build the spec in docs/spec/1-upcoming/writing-the-session-outside-the-panel:
whenever the panel's history changes, the session record is rewritten by
something no unmount can stop.

Read 1-index.md, 2-requirements.md and 3-design.md before starting. 4-tasks.md
gives the build order in two commits, and opens with two things to measure
before you start. The suite must stay green at each commit.

Repo conventions are in docs/AGENTS.md: package layout, test placement, and the
rule that a prompt change is a behaviour change. Read it first.

Verify before trusting:
- SessionPanel reports the ending from a useEffect, and that effect is the only
  path to the session write. Confirm before removing it, since the whole spec
  rests on it. A probe test that unmounts mid-turn shows processUtterance called
  and onTurnEnded not.
- SessionStore.write is whole-file, never awaited, and silent on failure.
  Confirm before writing through it five times a turn.
- AskedEntries rewrites earlier entries, so the record is a snapshot rather than
  a log. Confirm before deciding what the recorder is handed.
- restoredState ignores the stored phase, and AskedEntries settles pending
  entries on the way in. Confirm both, since a mid-turn record now depends on
  them rather than merely benefiting from them.
- Check whether anything other than the panel's effect writes the store.

Two end-to-end checks the suite cannot make, both on a phone:
- Close the panel mid-dictation, reopen: the turn is in the restored session
  with its utterance and summary.
- Start a turn, background the app until it is evicted before the turn ends:
  the utterance is in the restored session and the panel opens idle.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it. Leave finished work in the tree without committing; Ilya chooses the
grouping and the message.
```
