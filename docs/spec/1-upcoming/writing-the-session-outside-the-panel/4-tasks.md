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

## Before starting

Two things the design asserts that are worth measuring rather than trusting:

- What a write costs on a phone, through Obsidian's adapter. Roughly five to ten
  per turn, each a small whole-file rewrite. If it shows, debounce inside
  SessionRecorder rather than changing when the panel records.
- That a record written mid-turn restores sensibly. restoredState ignores the
  stored phase and AskedEntries settles pending entries, both written for an
  evicted WebView, so this should hold. Confirm it does before relying on it.

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
