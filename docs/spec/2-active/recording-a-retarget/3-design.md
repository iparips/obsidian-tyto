---
created: 2026-09-16
updated: 2026-09-16
---

# Design

A retarget moves the header and leaves no other trace. Three destinations want
it, and they do not all take it the same way.

## Goal

Record that a session changed note, so a transcript read back says when it
happened and the model can see why consecutive turns discuss different notes.

## What Carries A Retarget Today

SessionProgress.publisher wires the channel
([session-progress.ts:27](../../../../src/session/session-progress.ts)):

```typescript
(path) => this.session.retargets.publish(path),
```

One subscriber, useTargetNote, which sets the header name. Nothing else.

Beside it, the skill-loaded callback takes the other route. The reason is
written down at
[session-progress.ts:29](../../../../src/session/session-progress.ts): it is
published as a step rather than a line beside the list, because its place in the
order says whether it happened before the edit. A retarget has the same claim.

## Two Writes, Three Destinations

A retarget writes twice, and the two are independent:

```text
TurnStep.retargeted  -> publishStep       -> session.steps -> panel entry list
ChatMessage.system   -> appendChatMessage -> chat history  -> model, transcript
```

The panel reads steps, so the step is what reaches it. The model reads the
history, and so does the transcript through TranscriptSource.chatHistory, so one
message serves both. Between Turns below is why the history rather than a step
carries the transcript.

## What Changes

| Concern             | Today              | New                                       |
| ------------------- | ------------------ | ----------------------------------------- |
| Panel header        | Names the new note | Unchanged                                 |
| Panel entry list    | Nothing            | A step saying the note changed            |
| Transcript          | Nothing            | The same step, in the turn it happened in |
| Model history       | Nothing            | A system message where it happened        |
| Retarget while idle | Moves the header   | See Between Turns below                   |

## The Step

TurnStep gains a factory beside the others
([turn-step.ts:29](../../../../src/engine/turn-step.ts)), taking the shape of
TurnStep.opened, which already renders a path:

```typescript
static retargeted(path: string | null): TurnStep {
  return new TurnStep('Retargeted', path ?? 'no note bound')
}
```

The null case exists once
[binding-to-the-active-tab](../binding-to-the-active-tab/1-index.md)
lands. Before it, a retarget always carries a path.

## The Message To The Model

PromptFactory puts the note context after the history
([prompt/index.ts:36](../../../../src/model/prompt/index.ts)), so a retarget
message sits in the conversation where it happened and the standing "here is the
note now" message still comes last. Nothing about the ordering changes.

The message is a past-tense event, not a directive. That distinction is the
answer to the risk below.

```typescript
ChatMessage.system('The user moved to a different note. Later turns are about this one.')
```

## Behaviour Sequence

```mermaid
sequenceDiagram
    participant Engine as EditEngine [Engine]
    participant Publisher as TurnProgressPublisher [Engine]
    participant Progress as SessionProgress [Session]
    participant Sessions as SessionRepository [Session]
    participant Transcript as TranscriptRepository [Session]
    participant Panel as SessionPanel [Session]

    Engine->>Sessions: bindTo
    Engine->>Publisher: retargetedFn

    Publisher->>Progress: retargeted
    Progress->>Panel: publish header change
    Progress->>Panel: publish step [new]
    Progress->>Transcript: panelStepPublished [new]

    Engine->>Sessions: record retarget message [new]
    Note over Sessions: the model reads it as history on the next turn
```

Arrows: uses-relationship (client to supplier).

Today only the header arrow exists.

## Between Turns

A recorded step is created by TranscriptRepository.recordCall, before a provider
call ([transcript-repository.ts:38](../../../../src/session/transcript/transcript-repository.ts)),
and TranscriptTurnSection writes one section per conversation turn. A retarget
while the session is idle has no turn to belong to, which is the mobile case
that raised this spec.

The chat history has no such gap. SessionRepository.appendChatMessage writes
into the list PromptFactory sends, so a retarget appended the moment it happens
sits in the conversation at that point whether or not a turn is running.

That makes one write serve the model and the transcript. TranscriptSource
already carries chatHistory
([transcript-source.ts:22](../../../../src/session/transcript/models/transcript-source.ts)),
so the transcript renders the retarget from the history rather than needing a
section kind of its own.

The panel step keeps the step route, since the panel list is built from steps
and not from the history. The two halves are independent: a retarget writes one
message and publishes one step.

Enqueueing the retarget as a turn was rejected. See D2 in
[4-decisions.md](4-decisions.md).

## Test Plan

### TurnStep

- renders the path when a note is bound
- says no note bound when the retarget carries null

### SessionProgress

- publishes a step when the session retargets
- counts the step against the transcript, so the two stay in step

### TranscriptTurnSection

- writes a retarget that happened inside a turn, in that turn
- writes a retarget that happened between turns, at the point it happened

### PromptFactory

- carries the retarget message in the history, ahead of the note context

### EditEngine

- appends the retarget message whether or not a turn is running

## Out Of Scope

- When a retarget happens, which is
  [binding-to-the-active-tab](../binding-to-the-active-tab/1-index.md).
- Naming the note in the message. The note context that follows already names
  it, and the archived finding below is about note-naming.

## Risk

[29-following-the-note-across-a-restore](../../3-archived/29-following-the-note-across-a-restore/1-index.md)
found the model re-running a command that dragged the target back mid-turn. It
named NoteContextMessage as one of three causes. That message asserts the
current note last and says it supersedes everything above, which reads as a
directive.

A past-tense event in the history is a different shape, and the message above
names no note for that reason. Whether that holds is a judgement the unit tests
cannot make, so test a real vault before calling it done, the way
[AGENTS.md](../../../AGENTS.md) asks for any prompt change.

## References

- [2-requirements.md](2-requirements.md) - the three destinations and the open questions
- [binding-to-the-active-tab](../binding-to-the-active-tab/1-index.md) - the sibling, which fixes when a retarget happens
- [src/session/session-progress.ts:27](../../../../src/session/session-progress.ts) - the retargets channel, beside the skill-loaded step that shows the pattern
- [src/engine/turn-step.ts:29](../../../../src/engine/turn-step.ts) - TurnStep.opened, the factory the new one is shaped after
- [src/session/transcript/transcript-repository.ts:38](../../../../src/session/transcript/transcript-repository.ts) - recordCall, which is why a between-turns retarget has no turn
