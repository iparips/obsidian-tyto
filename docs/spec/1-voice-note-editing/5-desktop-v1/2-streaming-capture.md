# Desktop V1: Streaming Capture

StreamingTranscriber (src/capture/streaming-transcriber.ts) replaces Recorder for live sessions. Recorder stays untouched as the batch fallback.

## Audio Pipeline

- getUserMedia with settings.microphoneDeviceId, falling back to default when unset or unplugged (FR31).
- An AudioWorklet (src/capture/pcm-worklet.ts) downsamples to 16 kHz mono and emits Int16Array chunks of about 100 ms.
- Chunks go to RealtimeSession.sendAudio; the worklet buffers while the socket is connecting so the first syllables are not lost.

## Session Flow

```
start():
  auth = provider realtime auth (DirectKeyAuth on desktop)
  session = realtimeProvider.openSession(auth, language)
  worklet begins; buffered chunks flush into session
  session.onPartial -> panel renders live transcript (FR7)

stop():
  worklet stops
  final = session.stop()          resolves once the provider flushes
  panel replaces partials with final; final feeds EditEngine unchanged
```

- The agent loop is untouched: EditEngine still receives one complete transcript per utterance.
- cancel() closes the session without resolving to the engine.

## Failure Handling

- openSession failure drops the utterance to the batch path (Recorder + batch transcribe) with a single notice; the session retries streaming on the next utterance.
- A socket drop mid-utterance keeps the partials, stops the worklet, and asks the user to resend; no silent data loss.
- All failures carry step 'transcription' in their Outcome (NFR5).

## Latency Budget

NFR2 allows 5 seconds end to end; streaming spends it as follows.

- Final transcript: near zero after stop; streaming has already caught up.
- Chat round-trip with tools: 1-3 seconds on notes of normal size.
- Apply and render: under 100 ms.
- Notes beyond roughly 4k tokens erode the budget; V1 accepts this rather than chunking notes.
