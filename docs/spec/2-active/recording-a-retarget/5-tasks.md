---
created: 2026-09-16
updated: 2026-09-16
---

# Tasks

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
[binding-to-the-active-tab](../binding-to-the-active-tab/1-index.md) lands.
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
[4-decisions.md](4-decisions.md)), but the transcript does not read all of it.
It slices chatHistory by a step's recorded range, and tail() takes everything
after the last step. A message appended after the final turn is therefore
rendered; one appended between two turns falls into the next turn's leading gap,
which nothing slices.

Closing that gap is the work in this commit: the turn section needs to render
what precedes its first step, or the message needs a step range of its own.
Check which is smaller against transcript-turn-section.ts:85 before choosing.

Tests: the engine appends the message whether or not a turn is running, and the
prompt carries it ahead of the note context. The transcript renders a retarget
that happened between turns, at the point it happened.

## Verifying

Commit 1 is covered by the suite. Commit 2 is a prompt change, so it is not:
[AGENTS.md](../../../AGENTS.md) says test those against a real vault and a real
API key.

What to watch for is the failure archived spec 29 found. Bind a session, give an
instruction, switch to another note, then give a second instruction that names
no note. The second should land on the note now in front of you, and the model
should not reach back for the first.

If it does reach back, the message is reading as a directive rather than as
history. Take commit 2 out and keep commit 1: the panel and the transcript are
the destinations with nothing against them.
