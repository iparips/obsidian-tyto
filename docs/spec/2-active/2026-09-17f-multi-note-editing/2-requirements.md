---
created: 2026-09-17
updated: 2026-09-18
---

# Requirements

An utterance naming three notes writes to none of them. The model opens all three in one step, so every later edit anchors against whichever opened last. The turn ends stuck or out of steps, having written nothing.

The loop can already edit several notes in a turn: reach a note, edit it, reach the next. What is missing is the guarantee that a step's target holds still while the step runs.

## Motivation

### A Step Reads One Note And Writes To Another

A turn's target is one path. ModelService (engine turn) reads that note once at the start of a step and sends its text to the model, so every anchor the model writes is chosen against that text.

Two tools move the target mid-step. ToolDispatcher (engine) binds the session to a new path in moveSessionTargetNoteTo, which both run_command and open_note reach.

ToolCallExecutor (engine turn) guards a batch against a second edit, per isSecondEditIn. The reason matches: the note was read once, so a second anchored edit would compute its offsets against a note the first one changed. No guard covers a second retargeting call.

So a step that opens three notes retargets three times, and the edits that follow are all applied to the note that opened last. The read-once-per-step design assumes a stable target and nothing enforces it.

### A Right Anchor On The Wrong Note Reads As A Wrong Anchor

An anchor written for shopping-list.md is correct text that the daily note does not contain, so the edit is refused as a missing anchor.

A model reading that refusal lengthens the anchor and is refused again. RepeatedRefusalCounter (engine turn spending) then ends the turn on the second identical refusal. The anchor was right; the note under it was not.

### What The Fix Does Not Do

Refusing a mid-step retarget makes a step's target stable. It does not make a multi-note turn succeed on its own: the model still has to reach one note, edit it, then reach the next, and no rule can make it do that.

The prompt line asking for that shape is tuning rather than the fix. The model in both transcripts complied with the single-edit rule after being refused rather than after reading it, so the refusal is what carries the behaviour and the wording only saves a wasted step.

Nor does it make a command predictable. Obsidian decides which note a command opens, so the model learns the path from the result. That is why a command cannot be planned around, and why the rule refuses the second one rather than trusting the model to order them.

## In Scope

- Refuse a second retargeting call in a step, in ToolCallExecutor (engine turn) beside the existing single-edit guard. It covers run_command and open_note, the two reaching moveSessionTargetNoteTo.
- Say why in the refusal, matching the shape of SECOND_EDIT_REFUSAL: the target moves with the call, so a second one here leaves the first note unedited.
- Count an actual change of target, not a call that might have caused one. A command that opened nothing leaves the target untouched, so nothing about the step has become unsafe and what follows still runs. Per D4, this puts the guard after dispatch rather than before it.
- Let the first call of the step run. The guard refuses only what follows a move, and a command that already opened a note has moved the target whether or not the rest are refused.
- Keep the refusal out of RepeatedRefusalCounter, as refuseSecondEdit already does. A batch of three commands produces the same refusal twice, which would end the turn on a rule the model is complying with.
- Work in both open modes. Confirm mode parks the turn on each pick; auto mode resolves a lone candidate itself, per NoteChoiceService.singleMatch. The rule is about the target moving, and is indifferent to which route reached the note.
- Tell the model the shape in the system prompt: reach one note and edit it before reaching the next. Re-record the release 3 fixture deliberately, per CLAUDE.md, and test the wording against a real vault.

## Steps to Replicate

Reproduced against mistral-medium-latest on a real vault, twice, with the session transcripts kept. The second run is after the two landed fixes and still fails.

1. Open a vault with a todo, a shopping list and today's daily note, and commands that open each.
2. Say one utterance naming all three: add an item to the shopping list, add a todo, and write a line into the daily note.
3. The model runs all three commands in one step. The panel shows three retargets and the header names the last one.
4. It then sends the three edits, each anchored against the note it was written for.
5. The first is refused as a missing anchor; the second and third are refused as a second edit in a step. The model retries the first, is refused identically, and the turn ends "refused the same thing 2 times". Nothing is written.

## References

Repo-relative links: this repo sets no sdd.link_base row, so they resolve in a checkout rather than in a hosted view.

### Task

- [3-decisions.md](3-decisions.md) - open first. Which calls the rule covers, why a step cannot both reach and edit, and what the fix assumes about the model.
- [src/engine/turn/tool-call-executor.ts](../../../../src/engine/turn/tool-call-executor.ts) - the existing single-edit guard, and where the second one goes.
- [src/engine/tool-dispatcher.ts](../../../../src/engine/tool-dispatcher.ts) - moveSessionTargetNoteTo, the retarget both tools reach.
- [src/engine/turn/model-service.ts](../../../../src/engine/turn/model-service.ts) - the once-per-step read the whole rule rests on.
- [src/engine/waiting/note-choice-service.ts](../../../../src/engine/waiting/note-choice-service.ts) - singleMatch, and why the two open modes cost different numbers of interactions.
- [src/model/providers/models/tool-call.ts](../../../../src/model/providers/models/tool-call.ts) - the predicates a new one joins; isEditTool is the model to follow.
- Commits 79e505c and a777c0b - the two landed fixes, for the behaviour the acceptance checks assume.

### Architecture

- [docs/architecture/6-reaching-a-note.md](../../../architecture/6-reaching-a-note.md) - open first of these. Owns the target, the retarget, and the three routes that reach a note.
- [docs/architecture/4-the-turn.md](../../../architecture/4-the-turn.md) - open when changing the step loop or how a turn ends.
- [docs/architecture/2-vocabulary.md](../../../architecture/2-vocabulary.md) - turn, turn step and retarget, before naming anything new.
