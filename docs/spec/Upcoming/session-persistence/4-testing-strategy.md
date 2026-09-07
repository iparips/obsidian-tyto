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

## StoredSession (Session, new)

- Round-trips a bound session, so no field is lost between writing and reading.
- Round-trips an unbound session, so a null target is not read back as absent.
- Round-trips a message carrying tool calls, since those are the fields
  ChatMessage cannot rebuild itself from without.
- Round-trips a message carrying a tool call id, which a tool result needs.
- Round-trips every entry kind the panel renders.

## SessionStore (Session, new)

- Writes the record when a turn ends.
- Reads back what it wrote.
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
- Restores the stored entries into the panel.
- Restores the chat history into the repository, so the model reads it back.

## SessionPanel (Session, changed)

- Renders the restored entries when a session is restored.
- Renders no entries when a session is built rather than restored.
- Opens in the idle phase whatever phase was stored.
- Settles a restored pending choice, so no live rows outlive the app.
- Settles a restored pending question, so its suggestions go.
- Says the turn ended on a restored pending choice, rather than that it was
  declined.

## SessionRepository (Session, changed)

- Restores the target path from a record.
- Restores the messages from a record, in order.
- Reports the restored messages as the chat history, so the next turn sends
  them.

## What the engine tests must still prove

- A turn after a restore sends the restored history to the model.
- A turn after a restore edits the restored target note.
- A restored session with a target no editor shows behaves as an unbound one.
