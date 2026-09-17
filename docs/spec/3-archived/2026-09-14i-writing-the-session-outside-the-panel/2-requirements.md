---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

The session record is rewritten whenever the panel's history changes, by
something no unmount can stop, so what was shown is what is on disk.

## Motivation

Closing the Tyto panel mid-dictation edits the note and writes no session record
at all. Reopening finds the previous session, or none.

The turn itself is fine. The audio is sent, the transcript comes back, the model
runs and the note changes, all of which survive the panel because the engine
owns them. What does not survive is the record saying it happened.

[not-losing-a-recording](../../3-archived/2026-09-14f-not-losing-a-recording/1-index.md)
is what made this reachable. Before it, closing the panel mid-recording
discarded the audio, so no turn ran and there was nothing to persist. It now
sends instead, which is the right behaviour and exposed the hole beneath it.

## What writes the record today

onTurnEnded is a prop the panel calls, and the plugin's implementation of it
writes the store. The panel calls it from a React effect, which is deliberate:
the effect runs after the render the ending's own dispatch produced, so the
entries handed over include the summary or error that ended the turn. Calling it
inline would read the render the turn started on and drop that last entry.

Unmounting stops effects running. The turn's promise still resolves, and its
continuation still reaches anything that is not React, but nothing schedules
that effect again. So the call never happens, and the store's one writer is
never reached.

This is not a missing entry. It is a missing file.

## Why the panel is the wrong holder

A session record outlives the panel by definition. It exists so a session
survives the app going away, and the panel is one of the things that goes away.

Two halves make up the record, and only one of them is the panel's:

| Half                 | Held by                            | Survives unmount |
| -------------------- | ---------------------------------- | ---------------- |
| targetPath, messages | SessionRepository, built in wiring | Yes              |
| entries              | the panel's reducer                | No               |

So the entries have to reach the writer without the writer depending on React
being alive. That is the design question this spec answers.

## The second loss, behind the same write

The record is written once per turn, at its end, so nothing is on disk while a
turn runs. A WebView evicted mid-turn loses that turn entirely: the utterance,
the steps and the summary all go, because none of them were written.

Mobile evicts a backgrounded app, which
[session-persistence](../../3-archived/2026-09-07c-session-persistence/1-index.md) is
the record of. The window is one turn long, a few seconds against an eviction
measured in minutes, and
[not-losing-a-recording](../../3-archived/2026-09-14f-not-losing-a-recording/2-requirements.md)
named it and deferred it.

It is deferred no longer, because the fix is the same fix. A record written
whenever the history changes is a record that exists before the turn ends.

## What each change promises

| Change                           | Promise                                              |
| -------------------------------- | ---------------------------------------------------- |
| The panel stops owning the write | A closed panel still records the turn it was running |
| The record follows the history   | An eviction mid-turn keeps what was already shown    |

Both are the same rule: what the panel has shown is on disk, whatever happens
next.

## What a record must hold

A restored session is the conversation plus what the panel showed. Dropping the
entries would leave a session that restores its model history and shows an empty
panel, which reads as a session that never happened.

## What a mid-turn record restores as

A record written while a turn was running names a phase that is no longer true.
That is already handled: the stored phase is never read, and a restored session
opens idle whatever it was doing. Pending choices and questions settle on the
way in, so nothing comes back offering a control that cannot act.

Both were built for exactly this case, because an evicted WebView was always
able to leave a turn unfinished. Writing more often does not introduce the
problem; it makes the existing handling load-bearing.

## What is not in this spec

Persisting audio. The held utterance stays in memory, as
[not-losing-a-recording](../../3-archived/2026-09-14f-not-losing-a-recording/2-requirements.md)
decided. A record written mid-turn holds the transcript, not the recording
behind it.

## Test Scenarios

Setup is a bound note with a configured API key.

### A turn recorded after the panel closes

```gherkin
Given a recording is running
When  the panel is closed and the turn completes
Then  the session record holds that turn
And   reopening the panel restores it
```

### The record holds what the panel showed

```gherkin
Given a turn completed after the panel closed
When  the session is restored
Then  the history shows the utterance and the summary
And   the conversation continues from there
```

### A turn interrupted mid-flight keeps what was said

```gherkin
Given a turn is running and its transcript is in the history
When  the app is evicted before the turn ends
Then  the restored session holds the utterance
And   the panel opens idle rather than mid-turn
```

### An open panel records as it does today

```gherkin
Given the panel is open
When  a turn completes
Then  the session record holds that turn
And   the restored session is the same as before this change
```

### A cancelled turn still records

```gherkin
Given a turn is running
When  the user cancels it
Then  the session record holds the cancellation
```

## Questions

- How often the record may be written before the cost shows on a phone. Every
  dispatch is roughly five to ten writes a turn, each a small whole-file
  rewrite. Whether that wants debouncing is a question for the build, not the
  design.
- Whether a turn that ran unwatched should be marked in the restored history
  rather than reading as ordinary. Marking it is honest and costs an entry kind.

## References

### Task

- [src/session/views/SessionPanel.tsx](../../../../src/session/views/SessionPanel.tsx) - runTurn and the effect that reports the ending
- [src/main.ts](../../../../src/main.ts) - onTurnEnded, the store's one writer
- [src/session/session-snapshot-factory.ts](../../../../src/session/session-snapshot-factory.ts) - the two halves the record is built from
- [src/session/session-store.ts](../../../../src/session/session-store.ts) - the whole-file write, already fire and forget
- [src/session/models/asked-entries.ts](../../../../src/session/models/asked-entries.ts) - what settles a pending entry on the way back in

### Project

- [not-losing-a-recording](../../3-archived/2026-09-14f-not-losing-a-recording/1-index.md) - the spec that made this reachable, and where the eviction window was named
- [session-persistence](../../3-archived/2026-09-07c-session-persistence/2-requirements.md) - why a session is persisted at all, and the eviction this closes
