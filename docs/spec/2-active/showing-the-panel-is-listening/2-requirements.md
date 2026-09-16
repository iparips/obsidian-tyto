---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

A recording panel looks live, proves the microphone is hearing something, and
says how long it has been going.

## Motivation

Nothing in the panel changes when recording starts, except one button reading
Stop instead of Mic. The history is untouched. There is no line where the reply
will land, no level, no clock.

That leaves three questions a dictation cannot answer:

- Is it recording, or did the click miss?
- Is the microphone hearing me, or am I talking into a dead stream?
- How long have I been going, when a five-minute dictation is a real one?

The third matters most on a phone, where the panel is the whole screen and a
long dictation is the normal case.
[28-not-losing-a-recording](../../3-archived/28-not-losing-a-recording/1-index.md)
is the record of a five-minute dictation that was spoken twice.

## What the panel shows today

PendingEntry maps three phases to a line of text: transcribing, thinking and
cancelling. Recording is not one of them, so the history shows nothing at all
while the microphone is open.

The asymmetry is backwards. Transcribing and thinking are waits the user cannot
influence. Recording is the one phase where the user is doing the work, and it
is the one phase the panel says nothing about.

## What the panel has to prove

Three separate claims, and a single indicator cannot carry all three:

| Claim              | Answers                     | Fails silently today            |
| ------------------ | --------------------------- | ------------------------------- |
| The stream is open | Did my click land?          | A missed tap reads as recording |
| Audio is arriving  | Is it hearing me?           | A muted mic looks identical     |
| Elapsed time       | How long have I been going? | No clock anywhere               |

Audio is arriving is the claim no static badge can make. A pulsing dot that
animates on a timer proves only that the panel is repainting. It has to move
with the signal, or it is decoration that lies.

## The proposal

A recording strip in the history, where the pending line already sits, plus a
changed record button.

### The recording strip

One row, taking PendingEntry's place in the list, holding a level meter driven
by the live stream and an elapsed clock. Nothing else.

It reads as context weight, like the pending line, not as an entry. The turn has
produced nothing yet.

### The level meter

A short row of bars whose height follows the microphone's amplitude, sampled
through an AnalyserNode on the same MediaStream the recorder holds.

A meter, not a waveform. A waveform draws history, which needs a canvas and a
buffer, and history is not the question. The question is whether sound is
arriving now.

Silence has to look like silence. Bars at rest sit at a floor, and the floor
must be visibly lower than speech, so a muted microphone is distinguishable from
a working one within a second or two.

### The elapsed clock

m:ss from the start, in the same muted weight. It goes up, never down: there is
no limit worth counting toward. The transcription limits are 60 minutes and 500
MB, which no dictation reaches.

### The record button

The button carries the state the strip cannot, because a user looking at the
input row should not have to look up.

- Idle: Mic, ordinary weight
- Recording: Stop, with the accent colour, so the live state is visible in the
  row the thumb is already on

## What this does not add

- A waveform, or any drawing of what was said. The strip shows now, not history.
- A pause control. Stop and Send is the whole gesture.
- A countdown or a limit warning. No dictation reaches the limits.
- Live partial transcripts. Those arrive with streaming capture in
  [desktop-v1](../../1-upcoming/desktop-v1/3-streaming-capture.md), and the strip is the place
  they will land.

## Constraints

NFR1. Every colour comes from an Obsidian variable, so the strip follows the
user's theme. This is the rule the panel already holds.

NFR2. No layout that depends on panel width. The drawer is resized freely and
read on a phone, so the meter shrinks rather than wrapping.

NFR3. The meter costs nothing when idle. The AnalyserNode and its animation
frame exist only while recording, and both go when the stream closes. A panel at
rest must not hold an audio context.

NFR4. Reduced motion is honoured. Where the user has asked for less animation,
the bars stop animating and the clock alone carries the liveness.

NFR5. The strip is presentation. PanelState gains no entry kind, and no
publisher changes. The recording phase already exists.

## Test Scenarios

Setup is a bound note with a configured API key and microphone permission
granted.

### A recording says it is recording

```gherkin
Given the panel is idle
When  the record button is pressed
Then  the history shows a recording strip
And   the record button reads Stop in the accent colour
```

### The meter follows the voice

```gherkin
Given a recording is running
When  the user speaks
Then  the level meter rises above its resting floor
```

### A dead microphone looks dead

```gherkin
Given a recording is running with a muted microphone
When  the user speaks
Then  the level meter stays at its resting floor
```

### The clock counts the dictation

```gherkin
Given a recording has been running for two minutes
When  the user looks at the panel
Then  the strip shows the elapsed time
```

### Stopping clears the strip

```gherkin
Given a recording is running
When  the user presses Stop
Then  the strip is replaced by the transcribing line
And   the audio context is released
```

## Questions

- Whether the meter reads the recorder's own stream or opens a second
  getUserMedia. Sharing the stream is cheaper and avoids a second permission
  prompt, and needs the recorder to expose it. This is the one question that
  changes the design.
- Whether the clock belongs in the strip or the header. The header is where a
  running session already shows its state, but the strip keeps the two live
  facts together.
- Whether a long dictation earns a warning. Nothing breaks at any length, so the
  argument for one is about the user's attention, not the system's limits.

## References

### Task

- [src/session/views/PendingEntry.tsx](../../../../src/session/views/PendingEntry.tsx) - the phase-to-line map the strip replaces for recording; open first
- [src/recorder/index.ts](../../../../src/recorder/index.ts) - the MediaStream the meter needs, held privately today
- [src/session/views/hooks/useRecording.ts](../../../../src/session/views/hooks/useRecording.ts) - the lifecycle the meter attaches to, including the unmount that releases the stream
- [src/session/views/InputRow.tsx](../../../../src/session/views/InputRow.tsx) - the Mic and Stop button, and the phase it reads
- [styles.css](../../../../styles.css) - the context weight and pending line the strip matches

### Project

- [28-not-losing-a-recording](../../3-archived/28-not-losing-a-recording/1-index.md) - the lost five-minute dictation this is answering
- [desktop-v1](../../1-upcoming/desktop-v1/3-streaming-capture.md) - streaming capture, which puts live partials in the strip's row

### Architecture

- [6-tidy-up-chat-panel](../../3-archived/6-tidy-up-chat-panel/3-component-design.md) - the three weights the panel uses, and where styling lives
