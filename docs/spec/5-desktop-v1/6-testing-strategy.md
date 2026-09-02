# Desktop V1: Testing Strategy

Additions to the MVP suite. WebSocket and AudioWorklet are mocked in test-support; the worklet's DSP is extracted to a pure function so downsampling is unit-testable.

## Test Outline

### StreamingTranscriber (capture/streaming-transcriber.test.ts)

- flushes buffered chunks when the session opens after recording started
- forwards partial transcripts when the session emits them
- resolves the final transcript when stop is called
- falls back to the batch path when openSession fails
- keeps partials and asks for resend when the socket drops mid-utterance
- closes the session without output when cancel is called

### Downsampler (capture/pcm-worklet.test.ts)

- downsamples 48 kHz input to 16 kHz mono
- converts float samples to Int16 with clamping at the extremes

### Provider contract suite (providers/provider-contract.test.ts)

Runs against MistralProvider and OpenAIProvider with mocked transports.

- returns transcript text when batch transcription succeeds
- maps tool calls to the shared ChatTurn shape when chat returns them
- emits onPartial then onFinal when the realtime session streams
- returns a transcription-step failure when the realtime connection is refused

### ReviewController (engine/review-controller.test.ts)

- buffers operations without applying when review-first is on
- answers tool calls with queued-for-review when buffering
- applies the buffer in order when the turn is accepted
- re-validates anchors when accept follows a note change
- discards the buffer and appends a rejection message when rejected

### SessionPanel additions (session/SessionPanel.test.tsx)

- renders live partials while recording when streaming
- replaces partials with the final transcript when the utterance stops
- renders diff cards when a PendingTurn arrives
- disables the input row while a turn is pending review

### Settings additions (settings/SettingsPanel.test.tsx)

- switches the active key field when the provider changes
- resets the model to the provider default when it still holds the other default
- keeps a custom model when the provider changes

## Manual

- Exit test per the plan: mixed prose-and-structure dictation feels live; a rejected edit leaves the note untouched.
- Latency spot check against the NFR2 budget on a 1k-line note.
