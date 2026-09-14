---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

A recording is not thrown away because the screen went off or the panel closed,
and one that fails to transcribe is kept so it can be sent again.

## What was lost

A five-minute dictation on an Android phone, gone with nothing sent. The user
re-recorded it.

Five minutes is the fact that identifies the cause. It is about 1 MB of Opus
against a 500 MB limit, and five minutes against a sixty-minute one. No API
limit was anywhere near being reached, so the recording was never rejected. It
was discarded before a request was made.

## What discards it

useRecording subscribes to visibilitychange and discards the recording whenever
document.hidden becomes true. On a phone that fires when the screen locks, when
a notification is pulled down, and when the user switches app for a moment.

That is the whole app going away, not the panel. Collapsing the sidebar or
bringing another tab in front of the drawer leaves the recording running,
because the panel's own visibility is sessionLeafIsVisible and nothing in the
recording path reads it.

The discard says so in a notice, which auto-dismisses after a few seconds. A
user whose screen was off never sees it, so the panel is simply idle and empty
when they come back.

This was known and deliberately deferred. FR-scope of
[22-session-persistence](../../3-archived/22-session-persistence/2-requirements.md)
lists persisting a recording as out of scope, on the grounds that audio in
flight is discarded on background already. Nothing had hit it until now.

## The second loss, when the panel closes

Closing the view is not collapsing it. It unmounts the panel and drops the only
reference to the Recorder, and nothing releases the microphone on the way out.

So the stream stays open with the recording indicator lit, the audio reachable
by nothing, and no way for the user to stop or send it. Reopening the panel
builds a fresh Recorder rather than finding the old one.

That is a leak as well as a loss, and it predates this spec. It is fixed here
because the words go the same way they do on a background.

## The third loss, behind both

Recorder holds the audio in memory and hands it over once. The panel awaits the
transcription and dispatches a failure entry when it does not arrive, and
nothing else holds the blob.

So every transcription failure is also permanent: a rate limit, a dropped
connection and a mistyped key each cost the whole recording. That is a smaller
loss than either discard, because at least the user saw an error, but it has the
same remedy.

## What each change promises

| Change                   | Promise                                                        |
| ------------------------ | -------------------------------------------------------------- |
| Sending on backgrounding | A screen that locks mid-dictation still writes down the words  |
| Sending on a close       | A closed panel sends what it captured and frees the microphone |
| Holding the audio        | A failed transcription costs a click, never the recording      |

All three are about the same thing: audio the user has already spoken outlives
whatever went wrong next.

One rule covers the first two. Anything that ends a recording other than the
user sends it, whether that is the app going away or the panel closing. The
transcript reaches the history before the model is called, so sending is what
puts the user's words somewhere they can be read, and the edit that follows is
undone with Obsidian's own undo if it was not wanted.

## What sending costs

A glance at a notification mid-sentence now sends half a sentence, and the model
edits the note from the fragment.

| Interruption        | Today                    | After                                     |
| ------------------- | ------------------------ | ----------------------------------------- |
| Brief, mid-sentence | The whole recording goes | A fragment is transcribed and acted on    |
| Long, mid-dictation | The whole recording goes | What was said is transcribed and acted on |

The trade is deliberate. A truncated edit is visible in the history and
reversible with undo; a discarded recording is neither, and the user learns of
it only by finding the panel empty.

It is still a cost, and it is the reason the choice belongs in a setting
eventually. This spec ships the behaviour that loses nothing.

## What is not in this spec

Splitting a long recording across several requests. It was designed and then cut
once the five-minute detail landed, because the limits it works around are sixty
minutes and 500 MB and no dictation reaches them.

A recording that does reach an hour is a real but different problem, and
streaming in [desktop-v1](../../1-upcoming/desktop-v1/3-streaming-capture.md)
removes it properly rather than working around it.

## What holding the audio does not promise

The utterance is held in memory, not written to the vault. A crash, a reload or
an evicted WebView still loses it.

Sending rather than discarding keeps that from mattering in the usual case. The
turn runs immediately, and the session is written when it ends, so a completed
turn survives an eviction even though the audio behind it does not.

What is left is the turn still in flight when the WebView is evicted. Mobile
evicts a backgrounded app, which
[22-session-persistence](../../3-archived/22-session-persistence/1-index.md) is
the record of, and a turn interrupted that way leaves nothing written.

That window is a few seconds against an eviction measured in minutes, so it is a
much narrower loss than the one being fixed. Closing it means writing the
transcript as it is dispatched rather than at the turn's end, which belongs to
the persistence spec rather than this one.

One utterance is held at a time. Recording again replaces what was held, because
the retry is for the recording just made, not a history of them.

## Test Scenarios

Setup is a bound note with a configured API key.

### A failed transcription keeps the recording

```gherkin
Given a recording was made
When  the transcription fails
Then  the failure is shown
And   a retry control is offered
And   the audio is still held
```

### Retry sends the same audio

```gherkin
Given a transcription failed and its audio is held
When  the user retries
Then  the same audio is sent again
And   no new recording is made
```

### A successful retry runs the turn

```gherkin
Given a transcription failed and its audio is held
When  the user retries and the transcription succeeds
Then  the turn runs with that transcript
And   the retry control goes
```

### A second failure stays retryable

```gherkin
Given a retry was attempted and failed
When  the failure is shown
Then  the retry control is still offered
And   the audio is still held
```

### Recording again drops what was held

```gherkin
Given a transcription failed and its audio is held
When  the user records again
Then  the held audio is released
And   the retry control goes
```

### Backgrounding sends what was captured

```gherkin
Given a recording is running
When  the app goes to the background
Then  the recording stops
And   the captured audio is transcribed
And   nothing is discarded
```

### The transcript is in the history on returning

```gherkin
Given a recording was sent because the app went to the background
When  the user comes back
Then  the words spoken before it are in the history
And   the turn that ran on them is there too
```

### Backgrounding outside a recording changes nothing

```gherkin
Given no recording is running
When  the app goes to the background
Then  nothing is stopped
And   no turn runs
```

### Closing the panel sends what was captured

```gherkin
Given a recording is running
When  the Tyto panel is closed
Then  the recording stops
And   the captured audio is transcribed
And   the microphone is released
```

### Collapsing the sidebar does not stop a recording

```gherkin
Given a recording is running
When  the sidebar is collapsed
Then  the recording keeps running
And   nothing is sent
```

### A failure on a backgrounded send is still retryable

```gherkin
Given a recording was sent because the app went to the background
When  its transcription fails
Then  the audio is still held
And   a retry control is offered
```

## Questions

- Whether the retry belongs on the error entry or the input row. The design puts
  it on the entry, beside the failure it undoes.
- Whether a user who wants a hide to discard should be able to choose that. The
  onBackground setting in
  [mobile-v1](../../1-upcoming/mobile-v1/2-component-design.md) is where the
  choice belongs; this spec ships one behaviour rather than a setting with one
  option.
- Whether a lock screen should be told apart from an app switch. It cannot be:
  visibilitychange reports neither, and both mean the microphone is about to
  stop.

## References

### Task

- [src/session/views/hooks/useRecording.ts](../../../../src/session/views/hooks/useRecording.ts) - discardOnBackground, which throws the recording away, and stop, which drops it on failure
- [src/main.ts](../../../../src/main.ts) - onDocumentHidden, the visibilitychange subscription behind it
- [src/recorder/index.ts](../../../../src/recorder/index.ts) - stop and cancel, which differ in whether an utterance comes back
- [src/session/models/panel-state.ts](../../../../src/session/models/panel-state.ts) - the error entry a retry control would sit on

### Project

- [22-session-persistence](../../3-archived/22-session-persistence/2-requirements.md) - where discarding audio on background was deferred, and where WebView eviction is recorded
- [mobile-v1](../../1-upcoming/mobile-v1/2-component-design.md) - the onBackground setting this spec defers to
- [desktop-v1](../../1-upcoming/desktop-v1/3-streaming-capture.md) - streaming, which removes the duration limit properly
