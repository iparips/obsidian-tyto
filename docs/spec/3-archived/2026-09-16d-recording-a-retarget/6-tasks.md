---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

Both writes below were replaced by D1 of
[reporting-what-a-turn-did](../2026-09-16e-reporting-what-a-turn-did/1-index.md): the step
and the history message are gone, and a retargeted panel entry carries the
panel and the transcript instead. Kept as the record of what shipped here.

Two commits, one per write. They are independent: the panel step and the history
message share nothing but the moment they happen, so either order works and
either can land alone.

## Commit 1: the panel says the note changed

A retarget becomes a step, the way a loaded skill already does.

- TurnStep.retargeted(path) renders the path, and "no note bound" for null. It
  takes the shape of TurnStep.opened, which already renders a path
- SessionProgress.publisher publishes the step beside the header change, so the
  retargets channel keeps its subscriber and gains nothing
- publishStep counts it against the transcript, as it does for every step

The null case only arises once
[binding-to-the-active-tab](../2026-09-16c-binding-to-the-active-tab/1-index.md) lands.
Before it, a retarget always carries a path, so the null test covers a state the
sibling produces.

Tests: the step renders a path, the step says no note bound on null, and
SessionProgress publishes one when the session retargets.

## Commit 2: the model and the transcript see it

A retarget appends a message to the chat history.

- EditEngine.followActiveNote appends ChatMessage.system saying the target
  moved, beside the publish it already does
- The message names no note. The note context that follows already names the
  current one, and naming a note is what archived spec 29 found dragging the
  target back
- PromptFactory is untouched: it puts the note context after the history, so
  the message sits where it happened and the standing message still comes last
- TranscriptTurnSection renders the message from TranscriptSource.chatHistory,
  which it already carries

The history is the right home for the model (D2 in
[4-decisions.md](4-decisions.md)). The transcript does slice all of it:
recordCall opens each step's range where the one before it closed, so no message
is skipped by index. The gap is in rendering, not slicing.

A retarget inside a turn or between two turns reaches a Request block, where
requestLines filed it as the user. One appended after the last turn reaches only
the tail, which the Response block drops. Both are fixed in this commit, and
[3-design.md](3-design.md) holds the three positions and what each needed.

Tests: the engine appends the message whether or not a turn is running, and the
prompt carries it ahead of the note context. The transcript renders a retarget
at the point it happened, once, and never as the user.

The checks a person runs are in [5-tests.md](5-tests.md).
