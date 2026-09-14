---
created: 2026-09-14
updated: 2026-09-14
---

# Not Losing A Recording: Spec

A long recording was dictated, sent, and lost. The transcription did not come
back, and the audio was already gone, so the whole thing had to be spoken again.

Two changes, in that order of value. The utterance survives a failed
transcription, so any failure costs a click rather than the recording. And a
recording too big to send in one request is sent in several, so length stops
being a way to fail at all.

The first is the one that matters: it covers every reason transcription can
fail, not the one that was hit. The second removes the specific cause.

- [2-requirements.md](2-requirements.md) - what is lost today, and what each change promises
- [3-design.md](3-design.md) - where the held utterance lives, and how a split one is sent
- [4-tasks.md](4-tasks.md) - build order in three commits

Streaming capture in [Upcoming/desktop-v1](../desktop-v1/3-streaming-capture.md)
removes the size ceiling a different way, and keeps the batch path as its
fallback. Both changes here outlive it, because the fallback is this path.
