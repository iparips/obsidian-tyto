---
created: 2026-09-14
updated: 2026-09-14
---

# Tasks

Two commits. The first adds the recorder and writes through it; the second takes
the old write out.

That order keeps the suite green at each: the record is written twice in between,
which is wasteful for one commit and correct throughout.

## Commit 1: the record follows the history

SessionRecorder (Session) holds the last entries and writes the record through
SessionStore. It is built in wiring beside SessionRepository, and the panel
records to it on every dispatch.

- SessionSnapshotFactory is untouched: it assembles the same record, called more often
- SessionStore is untouched: the write is already whole-file and fire and forget
- The reducer is untouched, and still owns what an entry looks like
- The panel still renders from its own state, so nothing about the display moves
- The recorder takes the entries as they now stand, since a later action can
  rewrite an earlier entry

Tests cover the recorder writing on a dispatch, the record holding the whole
list rather than the newest entry, an entry rewritten by a later action being
written in its new form, and an unmount leaving the last state written.

## Commit 2: the panel stops owning the write

onTurnEnded goes from SessionPanelProps, the effect that called it goes, and the
ending state the effect was held for goes with them. main.ts stops wiring it.

buildSnapshotFromEntries goes with them. The recorder holds the repository and
assembles the record itself, so the prop that let the plugin do it has no reader
left.

- notifySucceeded and notifyFailed stay: a notice is a judgement about what is on
  screen, and the panel is the right place to ask
- Nothing replaces onTurnEnded. No ending is detected anywhere
- The record is unchanged, so a session written before this restores after it

Tests cover a turn ending after an unmount still being written, a mounted turn
being written as before, a cancelled turn being written, a mid-turn record
restoring idle, and a pending choice in one settling on the way in.

The reported loss stops here, and so does the eviction window: closing the panel
mid-dictation records the turn, and a turn interrupted mid-flight keeps what was
already shown.

## What was measured before building

Two things the design asserts, checked rather than trusted.

The write cost. A fifty-turn session serialises to 146 KiB, and stringify takes
0.05 ms. A five-turn session is 15 KiB and 0.007 ms. The main-thread cost is
below noticing, and the adapter write is never awaited by the turn, so what
could still show is I/O contention rather than a pause in the panel. No debounce
was built. Add one inside SessionRecorder if the phone says otherwise.

That the panel's effect is really the only path to the write. A probe test that
unmounts mid-turn confirmed it: processUtterance was called, onTurnEnded was
not, and nothing was written. Grep found no second writer.

That a record written mid-turn restores sensibly. restoredState ignores the
stored phase and AskedEntries settles pending entries, both already covered by
tests that this change makes load-bearing rather than incidental.

## After the commits

Test against a real vault and a real API key.

- Close the panel mid-dictation, reopen it: confirm the turn is in the restored
  session, with the utterance and the summary.
- Do the same with the panel open throughout: confirm nothing about an ordinary
  turn changed.
- Cancel a turn, reopen: confirm the cancellation is in the record.
- On a phone, start a turn and background the app long enough to be evicted
  before the turn ends: confirm the utterance is in the restored session and the
  panel opens idle.
- Watch a long turn on a phone for any pause as the steps land, which is what a
  write costing more than expected would look like.
