---
created: 2026-09-14
updated: 2026-09-14
---

# Not Losing A Recording: Spec

A five-minute dictation on an Android phone was lost with nothing sent. The
words had to be spoken again.

Five minutes is the detail that names the cause. No API limit is anywhere near
reached at that length, so nothing rejected the recording. The app was hidden
mid-dictation, and hiding discards.

One rule and one safety net. Anything that ends a recording other than the user
sends what it captured instead of throwing it away, whether that is the app going
away or the panel closing. And an utterance survives a failed transcription, so
every other way a recording can be lost costs a click instead.

Closing the panel turned out to leak the microphone as well as the words, since
nothing released the stream on the way out. The same cleanup fixes both.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - what was lost, what discards it, and what each change promises
- [3-design.md](3-design.md) - the hide taking the send button's path, and the held utterance
- [4-tasks.md](4-tasks.md) - build order in three commits

Splitting a long recording across several requests was designed here and cut.
The limits it worked around are 60 minutes and 500 MB, which no dictation
reaches, and it was verified not to work on iPhone at all. The README states the
limits instead.

Narrows the scope decision in
[22-session-persistence](../../3-archived/22-session-persistence/2-requirements.md),
which deferred persisting a recording on the grounds that audio in flight is
discarded on background already.
