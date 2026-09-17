---
created: 2026-09-10
updated: 2026-09-10
---

# Requirements

A session that went wrong leaves the panel as its only record, and the panel is
not copyable. One button in the header puts the session on the clipboard, so a
bad turn can be filed rather than described from memory.

## Motivation

Prompt changes are behaviour changes, and the unit suite cannot catch a
regression in judgement. Tuning the harness runs on real sessions, and a real
session currently survives only as a screenshot.

A screenshot truncates a long steps list, carries no text to grep, and says
nothing about what the model was told. Reading a failure needs the steps as
text; fixing it needs the inputs each turn step was given.

## In Scope

- A Copy button in the panel header, beside Reset, putting a Markdown
  transcript of the session on the clipboard.
- A setting turns the button on, off by default: the transcript carries note
  text and vault instructions verbatim, so copying it is opt-in. With it off,
  the header is as it is today.
- The transcript opens with session metadata: when it was copied, the bound
  note, the model, and the settings deciding which prompt sections exist. Never
  the API key.
- It nests as the engine runs: a conversation turn is one utterance holding the
  turn steps it spent, each one model call and the tool calls it returned.
- A turn step is labelled in three blocks, in the order the engine runs them:
  the request to the model, the response from it, and what the harness did with
  that response.
- Harness work before the first model call, such as resolving the note and its
  instructions, is a Setup block rather than part of a step.
- Each harness block closes on an outcome: continue where the turn goes on, or
  the ending the harness reached and the message the user got. Running out of
  steps and giving up on a repeated refusal are different endings, though the
  user sees one message for both.
- It holds every panel entry: utterances, replies, answers and sources, steps
  with refusals, warnings, errors, cancellations, and choices and questions with
  what was picked.
- Anything unchanged between turn steps goes to an appendix, written once and
  cited from the steps that used it.
- TranscriptRepository (Session, new) records each turn step as it is sent,
  holding only what that step did not share with the others.
- The button confirms the copy as an entry copy already does, and disables while
  a turn runs.

## Steps to Replicate

On Wednesday 2026-09-09, bound to 1 - Journal/Weekly/Week-37/09-09-Wed.md, say
"Find a note from last week's Saturday and on top write that it was a great
day." The turn spends twenty steps globbing, eleven of them repeats, and fails
on its step cap. Nothing in the panel can then be selected as a unit, the steps
list is collapsed, and the inputs that produced the loop were never shown.

## Test Scenarios

Setup shared by every scenario:

- The panel is open and the session is bound to a note.
- A turn has run, taken at least one step, and ended.

### The button appears only when the setting is on

```gherkin
Given the copy transcript setting is off
When  the user opens the panel
Then  the header holds Reset and no Copy button
And   turning the setting on adds it
```

### A turn step holds its inputs, its output and its panel steps

```gherkin
Given a conversation turn spent three turn steps
And   the second returned two tool calls
When  the user clicks Copy
Then  the clipboard holds a Markdown document with a section per turn step
And   each names the prompt parts it was sent and what the model returned
And   the second nests both of the panel steps that came of it
```

### A part that did not change is written once

```gherkin
Given a session spent twenty turn steps and loaded a skill in the seventh
And   the user edited the note partway through
When  the user clicks Copy
Then  the appendix holds two system prompts, not twenty
And   each turn step cites the prompt and note text it was actually sent
```

### The harness names the ending it reached

```gherkin
Given a turn that ran out of steps
And   another that stopped on the same refusal twice
When  the user clicks Copy
Then  the last harness block of the first names exhausted
And   the last harness block of the second names stuck
```

## Questions

- Does an unbound session with no turns copy anything? The design assumes the
  button disables until the first entry lands, matching how Reset already reads.
- Session persistence is coming, and a recorded step indexes into the chat
  history rather than copying it. Whatever writes a session down has to write
  the transcript store with it, and restore both together.

## References

### Task

- [src/session/views/PanelHeader.tsx](../../../../src/session/views/PanelHeader.tsx) - open first; the header the button joins, and the Reset button it sits beside
- [src/model/prompt/index.ts](../../../../src/model/prompt/index.ts) - the four parts of a model call, and which of them vary between steps
- [src/engine/turn/model-service.ts](../../../../src/engine/turn/model-service.ts) - the one place every turn step passes through, so where a step is recorded
- [src/engine/turn/conversation-turn-runner.ts](../../../../src/engine/turn/conversation-turn-runner.ts) - the loop the two groupings are named after: a turn, and the steps it spends
- [src/session/session-repository.ts](../../../../src/session/session-repository.ts) - the chat history the appendix walks, and the shape the new repository sits beside
- [src/session/views/HistoryEntry.tsx](../../../../src/session/views/HistoryEntry.tsx) - the per-entry copy this follows, and the Entry union it switches on

### Project

- [19-relative-dates](../19-relative-dates/1-index.md) - the last session tuned from a screenshot, and what reading one costs without a transcript

### Architecture

- [docs/architecture/1-overview.md](../../../architecture/1-overview.md) - the dependency direction, which decides where the prompt may be stored and read
