---
created: 2026-09-16
updated: 2026-09-16
---

# Following The User Mid-Turn

## Motivation

A turn archiving the todo list was redirected to the shopping list halfway
through, because the user opened that note while it ran. The turn carried on
against the new note, the model was told nothing, and the three turns that
followed were it trying to work out what had happened. The todo file was left
with duplicated content.

Two defects produced that session, and neither is the retarget itself. Following
the user is deliberate: archived spec 29 made it the rule, and a session that
edits the note behind the user is worse than one that follows.

## In Scope

### A running turn is redirected mid-instruction

ConversationTurnRunner.retargetTo swaps the note the turn writes to and returns.
The next step reads a different note context, and nothing in the conversation
says why. Its own comment says the turn owns what it writes to, which is what
the method disproves.

So the model spent three turns insisting the open note was the shopping list,
which was true, and being unable to say how it got there.

A turn that finished what it started would not have been in that position. The
session still binds to the new note when the event fires; what defers is the
running turn's own target, so the utterance the user gave is carried out on the
note they gave it about, and the next turn starts where they now are.

### A batch of edits anchors against content the batch has changed

The model sent five replace_text calls computed from one snapshot. They apply in
order, each against the note the one before it changed. Edits one and two moved
the content, so anchor three missed. The repair attempts then duplicated the
Today items and left the Admin items twice under Archived.

| Call | Anchor computed from | Note when it applied     | Outcome |
|------|----------------------|--------------------------|---------|
| 1    | The turn's snapshot  | Unchanged                | Applied |
| 2    | The same snapshot    | Shifted by call 1        | Applied |
| 3    | The same snapshot    | Shifted by calls 1 and 2 | Refused |
| 4    | The same snapshot    | Shifted by 1 and 2       | Applied |
| 5    | The same snapshot    | Shifted by 1, 2 and 4    | Applied |

The system prompt tells the model that multi-part instructions become multiple
tool calls applied in order, so the batch is what it was asked for. What it is
not told is that an anchor it computed is stale the moment a sibling call lands.

Archived spec 33 raised this as D4 and left it open, on the grounds that the
case was narrower than the one reported. This session is that case, and it cost
the user's todo file.

An edit scattered across a note, which archiving is, is the wrong shape for
anchored edits: one rewrite has no siblings to go stale against. A whole-note
tool takes all three guards D5 settled, so it refuses unless the model read the
note this turn, refuses when the note moved under what it carries, and asks
before it lands.

That leaves the anchored tools, which stay for the edits a rewrite would be
heavy-handed for. D6 asks what stops their anchors drifting, since the note
context is rebuilt per turn step rather than per tool call.

## Steps to Replicate

The retarget. Start a turn that edits one note, open a different note while it
runs, and read the note context on the next step: it names the note now in front
of the user, with nothing saying it changed.

The stale anchors. Have the model send several replace_text calls in one batch
whose anchors overlap the region an earlier call rewrites. Later anchors miss,
and a model that retries from the same snapshot misses again.

## References

### Task

- [src/engine/turn/conversation-turn-runner.ts](../../../../src/engine/turn/conversation-turn-runner.ts) - open first: retargetTo, which swaps the note and tells no one
- [src/engine/turn/tool-call-executor.ts](../../../../src/engine/turn/tool-call-executor.ts) - the loop applying a batch in order, where a stale anchor is caught or is not
- [src/engine/edit-engine.ts](../../../../src/engine/edit-engine.ts) - followActiveNote, which decides a running turn follows at all
- [8-transcripts.md](8-transcripts.md) - the reported session, where note context v4 is the retarget

### Project

- [33-reporting-what-a-turn-did](../../3-archived/33-reporting-what-a-turn-did/1-index.md) - removed the history message this spec partly restores, and left the batch question open as D4
- [29-following-the-note-across-a-restore](../../3-archived/29-following-the-note-across-a-restore/1-index.md) - why following the user is the rule, which this spec does not change
