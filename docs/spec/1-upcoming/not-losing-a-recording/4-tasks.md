---
created: 2026-09-14
updated: 2026-09-14
---

# Tasks

Three commits. The first two are the change worth having; the third removes the
cause that prompted it.

Commit 1 ships on its own. If the splitting turns out worse than it looks, the
recording is already safe without it.

## Commit 1: a failed transcription keeps the audio

useRecording (Session Views Hooks) holds the last utterance in a ref, set before
the transcription and cleared when one succeeds. The hook gains a retry that
sends what is held.

- Recording again replaces what is held; cancel clears it
- Only the transcription step holds audio, so only it is retryable
- The Recording interface gains retry, which SessionPanel passes down

Tests cover a failure leaving the utterance held, retry sending the same blob
and type, success clearing it, a second failure staying held, and a new
recording replacing it.

No UI yet. The hook is complete and tested before anything renders it.

## Commit 2: the panel offers the retry

The error entry (PanelState, Session Models) gains a retryable flag, and
HistoryEntry (Session Views) renders a retry control on an entry that carries
it.

- The reducer sets the flag for a transcription failure while audio is held
- A new recording clears the flag on earlier entries, so no stale control sits
  above a fresh recording
- The control calls the hook's retry, the way a choice entry calls its asker

Tests cover a transcription failure rendering the control, a chat failure not
rendering it, the control calling retry, and a new recording clearing it.

The behaviour this spec is for lands here. Everything after is about the cause.

## Commit 3: a long recording is sent in parts

Recorder (Capture) passes a timeslice to MediaRecorder.start, so chunks arrive
during recording rather than only at stop. UtteranceParts (Capture, new) turns
those chunks into one blob per part.

- The single-blob path is unchanged for an utterance within the limit
- Every part after the first carries the header chunk, or it is not a media file
- The threshold is 40 minutes, below the 60 the limits page states
- The provider sends parts in order and joins the transcripts with a space

Tests cover one part under the limit, splitting over it on chunk boundaries, the
header chunk riding on later parts, joining in order, and a failed part failing
the utterance.

This is the commit with real risk: the header handling is a claim about the
container format, not about this codebase. Verify it against a real recording
before trusting the unit tests, which use fabricated chunks.

## After the commits

Test against a real vault and a real API key.

- Record briefly with a wrong key: confirm the failure shows a retry, fix the
  key, retry, and confirm the turn runs without speaking again.
- Retry a second time after a second failure: confirm the control stays.
- Record again after a failure: confirm the old retry control goes.
- Record past 40 minutes: confirm it transcribes, and read the join point for a
  lost or doubled word.
