---
created: 2026-09-07
updated: 2026-09-11
---

# Session Persistence: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows the
repo's conventions: one dedicated case per branch, named "does X when Y".

Two properties carry the risk. A record must survive a round trip without losing
a field, which the store tests directly. And a restored session must never come
back mid-turn, which needs a record written from a turn that failed with a
shortlist still pending.

The round trip is the one to get right. A field added to the record and not to
the reader is invisible until a real session loses it, so the test asserts the
whole record rather than the fields it remembers to check.

## Table of Contents

1. [StoredSession (Session, new)](#storedsession-session-new)
2. [SessionStore (Session, new)](#sessionstore-session-new)
3. [SessionBuilder (Session, changed)](#sessionbuilder-session-changed)
4. [SessionPanel (Session, changed)](#sessionpanel-session-changed)
5. [SessionRepository (Session, changed)](#sessionrepository-session-changed)
6. [TranscriptRepository (Session, changed)](#transcriptrepository-session-changed)
7. [SessionView (Session, changed)](#sessionview-session-changed)
8. [RestoredText and LocalTimestamp (Session, new)](#restoredtext-and-localtimestamp-session-new)
9. [TranscriptDocument (Session, changed)](#transcriptdocument-session-changed)
10. [TranscriptEntryLines (Session, changed)](#transcriptentrylines-session-changed)
11. [What the engine tests must still prove](#what-the-engine-tests-must-still-prove)

## StoredSession (Session, new)

- Round-trips a bound session, so no field is lost between writing and reading.
- Round-trips an unbound session, so a null target is not read back as absent.
- Round-trips a message carrying tool calls, since those are the fields
  ChatMessage cannot rebuild itself from without.
- Round-trips a message carrying a tool call id, which a tool result needs.
- Round-trips all eleven entry kinds the panel renders, including the steps entry
  holding a turn's whole step list.
- Rebuilds a tool result through toolCallResult rather than the constructor, so
  the role and the call id stay paired.

## SessionStore (Session, new)

- Writes the record when a turn ends.
- Reads back what it wrote.
- Reads nothing when the plugin folder is unknown, since the manifest's dir is
  optional.
- Writes nothing when the plugin folder is unknown.
- Reads nothing when no session has been written.
- Reads nothing when the stored file is not valid JSON.
- Reads nothing when the stored version is not the current one.
- Deletes the stored file when the version is not the current one.
- Deletes the stored session when the user resets.
- Reports nothing to the caller when a write fails, since the turn already
  happened.
- Leaves the running session untouched when a write fails.

## SessionBuilder (Session, changed)

- Builds a session from a file, as it does today.
- Restores a session from a record, binding to the stored target.
- Restores an unbound session when the record holds no target.
- Restores the stored entries into the panel, saying the session was restored.
- Stamps the restored line when the record says it was written.
- Leaves the line unstamped when the record was written before the field
  existed, since a stamp is worth less than the session.
- Leaves the line unstamped when the stored time is not a number, since an
  Invalid Date on screen is worse than no time.
- Drops the restored line from the next record, so a second restore adds one
  line and not two.
- Restores the chat history into the repository, so the model reads it back.
- Names the note from the stored path, since a record holds no basename.
- Seeds the transcript past the restored history, so the first step after a
  restore does not claim the previous session's messages.

## SessionPanel (Session, changed)

- Renders the restored entries when a session is restored.
- Says the session was restored when a record came back.
- Renders no entries when a session is built rather than restored.
- Opens in the idle phase whatever phase was stored.
- Settles a restored pending choice, so no live rows outlive the app.
- Settles a restored pending question, so its suggestions go.
- Says the turn ended on a restored pending choice, rather than that it was
  declined.
- Reports a finished turn through onTurnEnded as well as notifySucceeded.
- Reports a failed turn through onTurnEnded as well as notifyFailed.
- Reports a cancelled turn through onTurnEnded, which is the ending no callback
  carries today.
- Carries the entries the turn left, including the one that ended it, since a
  record written from the entries the turn started on loses its last line.
- Reports the ending once, since the entries reach the plugin from an effect
  rather than from the turn itself.

## SessionRepository (Session, changed)

- Restores the target path from a record.
- Restores the messages from a record, in order.
- Reports the restored messages as the chat history, so the next turn sends
  them.

## TranscriptRepository (Session, changed)

- Starts the first recorded step at zero, as it does today.
- Starts the first recorded step past the seeded length when a session was
  restored.
- Copies a transcript holding only the turns since the restore.

## SessionView (Session, changed)

- Binds the stored session when the leaf reopens, since Obsidian reopens it
  rather than the user.
- Names the restored note when the leaf reopens.
- Holds no session when nothing was stored.
- Holds no session when the view was built without a restore.
- Keeps the session the user started rather than replacing it, when they start
  one while the read is in flight.

## RestoredText and LocalTimestamp (Session, new)

The zone is the machine's, so these assert the shape around it rather than a
literal. A suite naming one zone fails on a machine in another.

- Names the day and time the session was last written.
- Says what the turns above it are missing, whatever the time reads.
- Reads without a stamp when the record carries no time.
- Pads a single-digit month, day, hour and minute to a fixed width.
- Names a zone, so a session read after moving says where it was had.

## TranscriptDocument (Session, changed)

- Names the day and time the transcript was copied, which nothing asserted
  before the formatting became shared.

## TranscriptEntryLines (Session, changed)

- Renders the restored line, which is what marks where a session came back.

## What the engine tests must still prove

- A turn after a restore sends the restored history to the model.
- A turn after a restore edits the restored target note.
- A restored session with a target no editor shows behaves as an unbound one.
