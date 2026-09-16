---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

Three commits. The first exposes the stream, the second builds the meter and the
clock behind it, the third puts the strip on screen and colours the button.

That order keeps the suite green at each. After commit 1 nothing reads the
stream; after commit 2 the hook exists with nobody rendering it.

## Commit 1: the stream is reachable

Recorder answers the stream it is recording, and the port the panel codes
against says so too.

- Recorder gains `stream(): MediaStream | null`, returning
  `this.recorder?.stream ?? null`. MediaRecorder exposes it, and releaseStream
  already reaches through to it
- RecorderPort gains the same member. Four test fakes implement the port:
  SessionPanel, SessionPanelRestore, SessionPanelRecording and
  SessionPanelTranscript. Each gains one method returning null
- Null between recordings, which is what the meter reads to know there is
  nothing to attach to

Tests in the Recorder suite: answers the live stream while recording, answers
nothing before a recording and after one.

Nothing consumes it yet, so the suite is green on the accessor alone.

## Commit 2: the level and the clock

A hook owning the audio graph, so no component holds a lifecycle.

`useRecordingLevel(streamFn)` returns a level from 0 to 1 and an elapsed
seconds count.

- An AudioContext and an AnalyserNode built when a stream first arrives, closed
  when it goes. Nothing exists while the stream is null (NFR3)
- Create the context inside the gesture that starts recording, not in an effect
  reacting to the phase. iOS suspends a context created outside a user gesture,
  and that is an assumption in 4-decisions.md worth respecting up front
- requestAnimationFrame reads getByteTimeDomainData and reduces it to one
  amplitude, so the loop stops when the panel is backgrounded
- Reduced motion holds the level at rest and stops the loop (NFR4)
- The elapsed count lives here too, since it ends with the same stream

Tests: builds no context while the stream is null, closes the context when the
stream goes, holds the level at rest under reduced motion.

happy-dom has no real AudioContext, so the tests drive a fake analyser. They
cover the lifecycle, not the numbers.

## Commit 3: the strip on screen

- RecordingStrip renders the bars and m:ss, taking PendingEntry's slot in
  HistoryList while the phase is recording
- PendingEntry is untouched: it already returns null for the recording phase,
  so the strip sits beside it rather than inside it
- InputRow's record button carries the accent colour while recording
- Every colour comes from an Obsidian variable, and the meter shrinks rather
  than wrapping (NFR1, NFR2)

Tests: the strip renders the meter and the clock while recording, renders
nothing in every other phase, and shows elapsed time as m:ss. InputRow carries
the accent colour while recording.

## Verifying

The suite covers the lifecycle and the rendering. It cannot cover the thing the
feature exists for: whether the bars visibly follow a voice and sit low in
silence.

Check on all three platforms, since the assumptions in 4-decisions.md differ by
platform:

- Desktop: speak and watch the bars, then mute and watch them fall
- Android: the same, over adb with Chrome DevTools
- iOS: the same, over Safari Web Inspector. This is where a suspended
  AudioContext would show as a meter frozen at rest while the clock still runs

A meter frozen at rest on iOS alone is the suspended-context assumption failing,
not a dead microphone. Try resume() on the record gesture before anything else.
