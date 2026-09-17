---
created: 2026-09-14
updated: 2026-09-14
---

# Tasks

Three commits. The first two are the fix; the third is the documentation that
replaces the feature this spec cut.

Commit 1 is the one that addresses the reported loss.

## Commit 1: anything but the user ending a recording sends it

discardOnBackground (useRecording, Session Views Hooks) calls the hook's own stop
instead of cancel, so a background takes the same path the send button does. The
hook also gains an unmount cleanup taking that same path, which is what a closed
panel hits.

- Recorder is untouched: stop already resolves with what was captured
- No new path: stop transcribes and runs the turn already
- The unmount cleanup is what releases the microphone, which nothing does today
- The Notice goes, since there is nothing to announce once the turn runs
- The README's On Mobile section says the partial audio is discarded, which this
  commit makes false. Correct it in the same commit, and say that collapsing the
  sidebar is not closing the panel

Tests cover a background during recording taking the stop path, an unmount
taking it too, the turn running on what was captured, neither doing anything
outside a recording, and no notice being shown.

The reported loss stops here. What the user dictated before the screen locked is
transcribed into the history rather than thrown away.

The leaked microphone stops here too. It is the same fix, because the cleanup
that sends the audio is the one that releases the stream.

## Commit 2: a failed transcription keeps the audio

useRecording holds the last utterance in a ref, cleared when a transcription
succeeds, and gains a retry that sends what is held. The error entry (PanelState,
Session Models) carries a retryable flag, and HistoryEntry (Session Views)
renders the control.

- Recording again replaces what is held; the user's own cancel clears it
- Only a transcription-step failure is retryable, since only it has audio behind
  it
- A new recording clears the flag on earlier entries, so no stale control sits
  above a fresh recording
- A turn sent by a hide fails the same way, so its error is retryable too

Tests cover a failure leaving the utterance held, retry sending the same blob
and type, success clearing it, a second failure staying held, a chat failure not
being retryable, and a new recording clearing the flag.

## Commit 3: the README states the limits

The provider's limits are 60 minutes and 500 MB per recording, and nothing in
the plugin enforces or warns about them. The README says so plainly, in the
section covering what a session costs.

- A recording past either limit fails at the provider
- The failure is recoverable, since the audio is held and can be retried
- No countdown, no indicator, no splitting

This replaces the splitting work this spec cut. A user planning an hour-long
dictation learns the limit before they start.

## After the commits

Test against a real vault and a real API key.

On a phone, which is where the reported loss happened:

- Start a dictation, lock the screen mid-sentence, unlock: confirm the words are
  in the history and the turn ran on them.
- Do the same by pulling down a notification, and by switching app briefly.
- Collapse the sidebar mid-dictation and reopen it: confirm the recording is
  still running, since collapsing is not closing.
- Close the panel mid-dictation: confirm the words reach the note, and that the
  microphone indicator goes out rather than staying lit.
- Lock the screen and come back after several minutes, long enough for Obsidian
  to be evicted: confirm the turn that finished before the eviction is still in
  the restored session, which is what the session write buys.

On desktop:

- Record briefly with a wrong key: confirm the failure shows a retry, fix the
  key, retry, and confirm the turn runs without speaking again.
- Retry a second time after a second failure: confirm the control stays.
- Record again after a failure: confirm the old retry control goes.
