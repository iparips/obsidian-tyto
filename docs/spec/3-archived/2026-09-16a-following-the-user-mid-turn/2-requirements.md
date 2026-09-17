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

Four changes. The first answers the retarget; the other three replace the
anchored batch, and they only work together.

### A running turn finishes on the note it started

ConversationTurnRunner.retargetTo swaps the note a running turn writes to, so
the turn carried on against the shopping list and the model could not say how it
got there. It stops swapping: the session still binds to the new note when the
event fires, and the running turn keeps the note it began on.

The utterance the user gave is then carried out on the note they gave it about,
and the next turn starts where they now are. Nothing is said to the model,
because a turn that never sees the new note has nothing to be told.

### One edit per step, enforced

A second edit call in one step is refused. The note context is rebuilt per turn
step, so an anchor is current when its step begins and stale the moment a
sibling call lands. Enforcing the boundary pairs every anchor with the read that
preceded it, which is what the anchored tools always assumed.

This is the fix. The two below are what make it affordable and what bounds the
damage while a batch is still possible.

### A whole-note write

A tool that replaces the note rather than anchoring into it, so a scattered edit
costs one call rather than one step per line. Without it, one edit per step
makes archiving twelve model calls.

It carries three guards, since a rewrite applies whatever it is given where an
anchor fails loudly: it is refused unless the model read the note this turn,
refused when the note moved under the content it carries, and confirmed by the
user before it lands.

Two prompt lines change with it. ModelsRole asks for a batch today, in the line
that produced the reported session, and forbids a whole-note write in as many
words. A skill whose workflow is inherently scattered, as the todo skill's
archive is, says so in its own steps.

### A batch stops at its first refusal

A backstop rather than a fix. With one edit per step there is no batch of edits
to stop, so this covers a batch mixing an edit with other calls.

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
- [7-analysis.md](7-analysis.md) - how the session reached the state it did, and the table of drifting anchors
- [8-transcripts.md](8-transcripts.md) - the reported session, where note context v4 is the retarget

### Project

- [reporting-what-a-turn-did](../../3-archived/2026-09-16e-reporting-what-a-turn-did/1-index.md) - removed the history message this spec partly restores, and left the batch question open as D4
- [following-the-note-across-a-restore](../../3-archived/2026-09-14h-following-the-note-across-a-restore/1-index.md) - why following the user is the rule, which this spec does not change
