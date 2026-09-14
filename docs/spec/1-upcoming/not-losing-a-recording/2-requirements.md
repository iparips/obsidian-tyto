---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

A recording that fails to transcribe is kept and can be sent again. A recording
too large for one request is sent in several.

## What is lost today

Recorder (Capture) holds the audio in memory and hands it over once. The panel
awaits the transcription and dispatches a failure entry when it does not arrive.
Nothing else holds the blob, so the failure is where the recording ends.

That makes every transcription failure permanent, whatever caused it. A rate
limit, a dropped connection, a mistyped key and an oversized upload all cost the
same thing: the recording.

The reported case was a long recording, so size is the likely cause. It is not
confirmed, and the design does not rest on it.

## Two candidate causes, one of them ruled out

| Cause              | Limit                  | Reachable by dictation                   |
| ------------------ | ---------------------- | ---------------------------------------- |
| File size          | 500 MB                 | No, not at speech bitrates               |
| Duration           | 60 minutes             | Yes, for a long session                  |
| Backgrounded panel | none, discards on hide | Yes, and discards without sending at all |

Size is not the ceiling a dictated note reaches. Opus in WebM at speech bitrates
puts an hour well under 100 MB, so 500 MB is hours of talking.

Duration is the reachable one, and the two Mistral documents disagree on it: the
model page says three hours per request, the limits page says sixty minutes. The
lower number is the one to design against.

Backgrounding is the other. A panel that goes to the background while recording
discards the utterance and says so in a notice, so a recording can be lost
without any request being made.

## What each change promises

| Change             | Promise                                                   |
| ------------------ | --------------------------------------------------------- |
| Holding the audio  | A failed transcription costs a click, never the recording |
| Splitting the send | Length stops being a way for a recording to fail          |

Holding the audio is the one worth having on its own. It covers causes nobody
has diagnosed, including the two above and whichever one was actually hit.

## What holding the audio does not promise

The utterance is held in memory, not written to the vault. A crash, a reload or
a closed WebView still loses it.

Persisting it would mean writing audio into the vault and deciding when to
delete it, which is a larger change with a privacy question attached. This spec
keeps the hold in memory and says so.

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

### A long recording is sent in parts

```gherkin
Given a recording longer than one request accepts
When  it is transcribed
Then  it is sent as several requests
And   the transcripts are joined in order
And   the turn runs with the joined text
```

### A short recording is sent whole

```gherkin
Given a recording within what one request accepts
When  it is transcribed
Then  one request is made
```

### A failed part fails the utterance

```gherkin
Given a recording is being sent in parts
When  one part fails to transcribe
Then  the utterance fails
And   the audio is still held
```

## Questions

- Whether the retry belongs on the error entry or the input row. The design puts
  it on the entry, beside the failure it undoes.
- Whether a part that fails should be retried alone rather than failing the
  whole utterance. Deferred: the held audio already makes a whole-utterance
  retry cheap, and per-part retry needs state the panel does not carry.
- Whether the user should be told a recording is being split. The position taken
  is no: it is the same utterance either way, and the steps list is not for
  transport detail.

## References

### Task

- [src/recorder/index.ts](../../../../src/recorder/index.ts) - where chunks accumulate and the blob is handed over once
- [src/session/views/hooks/useRecording.ts](../../../../src/session/views/hooks/useRecording.ts) - stop, which awaits the transcription and drops the blob on failure
- [src/model/providers/mistral-provider.ts](../../../../src/model/providers/mistral-provider.ts) - transcribe, which posts the whole blob
- [src/session/models/panel-state.ts](../../../../src/session/models/panel-state.ts) - the error entry a retry control would sit on

### Project

- [Upcoming/desktop-v1/3-streaming-capture.md](../desktop-v1/3-streaming-capture.md) - streaming, whose fallback is this path
