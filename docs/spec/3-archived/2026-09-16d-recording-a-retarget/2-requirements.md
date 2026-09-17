---
created: 2026-09-16
updated: 2026-09-16
---

# Recording A Retarget

## Motivation

A retarget publishes to the retargets channel, which moves the panel header and
nothing else. A session read back does not say when it changed note, and the
model sees consecutive turns discussing different notes with nothing explaining
the jump.

## In Scope

Three destinations, and the answer is yes for each.

- Transcript. Read by a person after the fact, never by the model, so a session
  read back should say when it changed note.
- Panel entry list. The same information, live. The skill-loaded step is
  already published for the stated reason that its place in the order says
  whether it happened before the edit.
- Model history. A system message in the conversation where the change
  happened.

## References

### Task

- [src/session/session-progress.ts](../../../../src/session/session-progress.ts) - open first: the retargets channel, beside the skill-loaded step that shows the pattern
- [src/session/transcript/transcript-turn-section.ts](../../../../src/session/transcript/transcript-turn-section.ts) - builds from recorded turn steps, so one TurnStep reaches the transcript and the panel together
- [src/model/prompt/index.ts](../../../../src/model/prompt/index.ts) - puts the note context after the history, so a retarget line sits where it happened

### Project

- [binding-to-the-active-tab](../2026-09-16c-binding-to-the-active-tab/1-index.md) - fixes when a retarget happens; this one records that it did
