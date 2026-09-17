---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D4: Where does the strip sit? [resolved 2026-09-16]

In the input row, taking the instruction field's place while recording. Ilya
reported the meter being invisible once the panel held a few turns, which it was:
the history scrolls, and the strip was its last child.

The first answer put the strip in PendingEntry's slot, which read well as a
design and failed in use. A meter answers whether the mic is hearing you now,
and you ask that while holding the button that started it, so it belongs where
your eyes already are rather than at the end of a scrolling transcript.

| Option                          | Cost                                                  |
| ------------------------------- | ----------------------------------------------------- |
| The instruction field's place   | Chosen                                                |
| Scroll the history to the strip | Fights a user who scrolled up, and only usually works |
| A row of its own above          | Adds a row, so both buttons move as it appears        |

Scrolling was weighed first and dropped. Done properly it means tracking whether
the user is pinned to the bottom, which is real state for a secondary benefit,
and it leaves visibility conditional on scroll position.

Taking the field's place rather than adding a row is Ilya's: the row keeps its
shape, so Stop and Cancel stay where the thumb that reached for them expects,
and only what sits between them changes. A row appearing above would move both
buttons at the moment the user is aiming at one.

The field is free to take because it is disabled while recording anyway, so it
was width nobody could use. The clock sits left of the trail, where a
fixed-width value anchors it and the bars take what is left.

#### D5: A level meter or a trail of recent readings? [resolved 2026-09-16]

A trail. Ilya asked for the shape a messaging app uses, where bars scroll left as
time passes rather than pulsing at the current level.

The design had rejected a waveform as answering a question nobody asked. That was
wrong about which question the strip answers. A user looks at it to learn the
microphone is working, and a level meter cannot say so: five bars at the floor
are a quiet room and a dead microphone alike. A trail separates them, because a
dead microphone draws a flat line where a quiet room still twitches.

| Option                     | A dead microphone reads as      | Cost                              |
| -------------------------- | ------------------------------- | --------------------------------- |
| A trail of recent readings | A flat line, unmistakably       | A ring buffer in the hook         |
| Five bars at the level     | Bars at the floor, like silence | None, which is what shipped first |

Cheaper than the rejection assumed. The bars were already one element per
reading, so no canvas is involved: the hook keeps an array and the strip maps it.

The readings are sampled every 100ms rather than per frame. The loop runs at the
display's rate, which would fill the trail in under half a second and show the
last blink rather than a trail.

#### D1: Does the meter share the recorder's stream or open its own? [resolved 2026-09-16]

Shares it. Ilya: share the recorder stream.

| Option                | Cost                                                     |
| --------------------- | -------------------------------------------------------- |
| Share the stream      | Recorder and RecorderPort each gain one accessor         |
| A second getUserMedia | A second permission prompt, and two tracks on one device |

Sharing is also the safer half on iOS, where a second track on the same device
is where capture tends to break. Recorder already reaches through to the stream
when releasing tracks, so exposing it adds no new coupling.

#### D2: Does the clock sit in the strip or the header? [resolved 2026-09-16]

In the strip, beside the meter. Ilya: clock besides the meter is fine.

The header already carries the note name and a running flag. Keeping the two
live facts together means a user watching the level is not also looking up.

#### D3: Does a long dictation earn a warning? [resolved 2026-09-16]

No. Ilya: no long dictation warning is fine.

Nothing breaks at any length. The transcription limits are 60 minutes and 500
MB, which no dictation reaches, so a warning would be about the user's attention
rather than the system's.

### Assumptions

- A meter that moves with the signal is what proves the microphone is live. The
  requirements argue this and the design follows it. If the bars turn out to be
  unreadable at panel width, the clock alone still answers two of the three
  claims, and the meter is the part to rethink.

## Design

### Assumptions

- The AudioContext can be created inside the record-button handler and iOS will
  not suspend it. WebKit suspends a context created outside a user gesture, and
  Obsidian on iOS is a WKWebView, so it follows Safari's rules rather than
  Chrome's. If it suspends, the meter needs an explicit resume() on the same
  gesture, which is a small change but only findable on a device.
- AnalyserNode reads a MediaStream the same way on all three platforms.
  Archived spec [mobile-mvp](../2026-08-28b-mobile-mvp/1-index.md) records
  that capture already differs by platform, iOS producing mp4 and Android webm,
  but that difference is in the recorded blob rather than in the live stream the
  analyser reads. If the meter is dead on one platform and not another, this
  assumption is where to look first.
- Widening RecorderPort costs its implementors nothing. The hook codes against
  the port rather than the class, and the fakes in the panel tests implement it,
  so each gains one method returning null.
- The strip renders where PendingEntry does, so it inherits the history's
  scrolling and needs no layout of its own. If it instead has to pin to the
  bottom of the list, that is a layout change the design does not carry.
