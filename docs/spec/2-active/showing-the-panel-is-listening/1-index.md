---
created: 2026-09-14
updated: 2026-09-14
---

# Showing The Panel Is Listening: Spec

Recording is the only running phase the panel says nothing about. A click that
missed, a muted microphone, and a dictation running five minutes all look the
same: one button reading Stop.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - the three claims a recording panel owes the user, and the strip that makes them
- [3-design.md](3-design.md) - the shared stream, the hook that owns the audio graph, and where the strip sits
- [4-decisions.md](4-decisions.md) - five resolved decisions, including the move out of the history and the trail, and the iOS assumption that shapes the hook
- [5-tests.md](5-tests.md) - five checks across three platforms
- [6-tasks.md](6-tasks.md) - three commits, and what only a real device can check

The proposal is a recording strip where the pending line already sits, holding a
live level meter and an elapsed clock, plus a record button that carries the
accent colour while the stream is open.

The meter is the part that cannot be faked. A dot pulsing on a timer proves the
panel is repainting, not that the microphone is hearing anything, so the bars
follow the stream's own amplitude and sit at a visible floor in silence.

Presentation only, as
[6-tidy-up-chat-panel](../../3-archived/6-tidy-up-chat-panel/1-index.md) was.
The recording phase already exists, and no publisher or entry kind changes.

Answers the dictation lost in
[28-not-losing-a-recording](../../3-archived/28-not-losing-a-recording/1-index.md)
from the other side: that spec stopped the words being thrown away, and this one
shows they are being captured while they are spoken.

The strip is also where streaming capture's live partials land, so
[desktop-v1](../../1-upcoming/desktop-v1/3-streaming-capture.md) inherits the row rather than
inventing one.

The meter shares the recorder's MediaStream rather than opening its own, so
Recorder exposes the stream it holds privately today. That is also the safer
half on iOS, where a second track on one device is where capture breaks.
