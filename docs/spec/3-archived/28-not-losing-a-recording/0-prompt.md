---
created: 2026-09-14
updated: 2026-09-14
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Build the spec in docs/spec/2-active/not-losing-a-recording: anything that ends a
recording other than the user sends what it captured rather than discarding it,
and a failed transcription keeps the audio so it can be sent again.

Read 1-index.md, 2-requirements.md and 3-design.md before starting. 4-tasks.md
gives the build order in three commits. The suite must stay green at each.

Repo conventions are in AGENTS.md: package layout, test placement, and the
rule that a prompt change is a behaviour change. Read it first.

Verify before trusting, since the spec was written before a package rename:
- Recorder lives in src/recorder/index.ts, and the package is recorder rather
  than capture.
- Recorder.stop resolves with an Utterance and Recorder.cancel discards.
  Confirm both before switching the hide path from one to the other, since the
  whole of commit 1 rests on it.
- runTurn dispatches the transcript entry before awaiting the model, which is
  why sending on a hide puts the words in the history. Confirm the order.
- useRecording holds the background listener in a ref already. Confirm that
  shape before adding the held-utterance ref next to it.
- The error entry carries a step but no retryable flag. Confirm before widening
  it, and check what else constructs an error entry.
- The background subscription is onDocumentHidden in src/main.ts, on
  visibilitychange. Confirm nothing else discards a recording.
- SessionView.onClose unmounts React and nulls panelProps, and useRecording has
  no unmount cleanup, so a closed panel leaks the stream. Confirm both before
  writing the cleanup, since that leak is half of commit 1.

The end-to-end behaviour is a judgement the suite cannot make, and the reported
loss was on a phone. Run the manual checks at the end of 4-tasks.md on a real
device, not only on desktop: lock the screen mid-dictation and confirm the words
are in the history when you come back.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it. Leave finished work in the tree without committing; Ilya chooses the
grouping and the message.
```
