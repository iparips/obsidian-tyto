---
created: 2026-09-18
updated: 2026-09-18
---

# An Answer Ends The Turn: Requirements

## Why

A question answered from search is answered twice. The model calls answer_from_search, the answer reaches the panel as its own block, and the turn keeps running. The model then spends one more step saying a shorter version of the same thing as text, which ends the turn as an assistant entry. The panel shows both.

A real turn hit this. Asked for themes across three weeks of reflection-tagged notes, the model loaded a skill, resolved the date, ran two greps, read ten notes over two steps, and answered with its sources cited on step 7. Step 8 restated it and ended the turn.

The restatement is not a summary of the answer. It carries the same ten headings in the same order, with the supporting sentences cut and every citation dropped, so the second block is the first one minus its evidence. That is what makes this worth fixing rather than tolerating: the user reads the finding twice and the second reading is strictly worse.

### The model was told and complied anyway

Step 8 opens with the tool result from the answer: "the answer reached the panel; say nothing further about it". The model had that text in context, produced no further tool call, and wrote the restatement as its reply.

So this is not a rule the model missed. It is a rule the model read and acted against, which is the evidence for removing the step rather than wording the instruction again. ToolDispatcher.publishModelAnswer (Engine) returns an ordinary outcome, and an ordinary outcome means another step exists for the model to fill.

### A wasted step on the turns with the least room

The same turn spent eight steps, two of them on near-identical greps and two more reading ten notes in batches of five. It fits only because 2026-09-18b-charging-a-batch-of-calls shipped and a batched call now costs less than a whole one. Step 8 is a full step of allowance spent restating step 7.

Ending on the answer returns that step to the budget, on exactly the shape of turn that runs closest to the cap: a question answered by reading widely.

### Why answering is terminal where asking is not

Two tools park a turn on the user and one ends it, and the difference is what the tool result carries back.

| Tool               | What the result carries      | What a later step does with it    |
| ------------------ | ---------------------------- | --------------------------------- |
| answer_from_search | Nothing the model can act on | Nothing; no tool writes an answer |
| ask_user           | The user's answer            | Acts on it, which is the point    |
| choose_note        | The path the user picked     | Opens it, then edits it           |

ToolDispatcher.askUser (Engine) awaits the user's answer and returns it as the tool result, so the turn has to continue: the answer is the instruction the next step carries out. ToolDispatcher.chooseNote (Engine) returns the picked path with "open it with open_note", which is the same shape.

An answer is the other shape. Nothing carries it into a note, the search tools have already run, and the panel has it. There is no work left for a later step, which is why the step exists only to talk.

## In Scope

- answer_from_search ends the turn it is called in, rather than returning an ordinary outcome that lets the loop run another step.
- What a tool call can tell the loop. ToolCallOutcome (Engine) carries a refusal and an edit position today, and carries no way to say the turn is over.
- Which TurnEndingKind (Engine Turn Ending) the transcript records for a turn an answer ended, and whether that is a new value.
- What the panel shows. The runner returns an Outcome<string> that SessionPanel (Session Views) dispatches as an assistant entry, so an answer ending a turn has to settle what that string is and whether an assistant entry is written at all.
- What the chat history holds after such a turn. Today it holds the second step's restatement, so removing that step means the answer text takes its place, per D4.
- The calls sitting beside answer_from_search in the same reply, which have already run by the time the loop sees the ending.

## Out Of Scope

- How the answer renders. The copyable block, the inline citations and the collapsed source list all shipped; this changes when the turn stops, not what the answer looks like.
- Batch charging. 2026-09-18b-charging-a-batch-of-calls settled what a batched call costs, and this spec changes no arithmetic.
- ask_user and choose_note ending a turn. Both return something the next step acts on, per Why, so ending on either would drop the work the user just authorised.
- The whole-note write confirmation in NoteChoiceService.confirmsWrite (Engine Waiting). It parks on the user the way choose_note does and its answer gates a write that has not happened, so it is the furthest thing from terminal.
- Warning the model in the prompt that answering ends the turn. The tool result already says it and the model ignored it; whether the system prompt should say it too is a prompt change, and a prompt change is a behaviour change that needs its own vault run.

## Scenarios

### An answer ends the turn on the step it was called in

**Given** a turn where the model has searched and read notes
**When** the model calls answer_from_search
**Then** the turn ends on that step
**And** no further model call is made

### The panel shows one answer and no reply

**Given** a turn ended by answer_from_search
**When** the panel settles to idle
**Then** the turn holds one answer entry
**And** it holds no assistant entry

### The transcript names how the turn ended

**Given** a turn ended by answer_from_search
**When** the transcript is written
**Then** the recorded ending distinguishes the turn from one the model ended by replying in text

### A turn still ends by replying when no answer was given

**Given** a turn where the model edits a note and then replies in text
**When** the turn ends
**Then** it ends as Replied, with the assistant entry it writes today

### Asking the user does not end the turn

**Given** a turn where the model calls ask_user
**When** the user answers
**Then** the turn continues
**And** the next step acts on the answer

### The calls beside an answer still run

**Given** a reply carrying answer_from_search and one other tool call
**When** the step executes
**Then** both calls run
**And** the turn ends once the step is done

## References

### Task

- [3-decisions.md](3-decisions.md) - open first: the four decisions this rests on, including whether the answer is the turn's outcome and whether the ending is a new kind
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - the vault checks, since whether the model would have talked again is a judgement
- `src/engine/tool-dispatcher.ts:202` - publishModelAnswer, which publishes the answer and returns an ordinary outcome; askUser at :231 is the shape that must not change
- `src/engine/tool-call-outcome.ts` - what a tool call tells the loop, and the two facts it carries today
- `src/engine/turn/conversation-turn-runner.ts` - runTurnStep and executeToolCalls, where a step decides whether the turn goes on
- `src/engine/turn/ending/turn-ending-kind.ts` - the five endings, one per way the loop can stop
- `src/engine/turn-ending-service.ts` - the endings that write to the chat history before returning, against TurnOutcomes which do not
- `src/engine/turn/tool-call-executor.ts` - the loop over a reply's calls, which runs them all and returns nothing about any of them

### Architecture

- [docs/architecture/2-vocabulary.md](../../../architecture/2-vocabulary.md) - the entry kinds, and why an assistant entry and an answer entry differ in three ways
- [docs/architecture/4-the-turn.md](../../../architecture/4-the-turn.md) - how the ending reaches the panel as a returned value where progress lines reach it by subscription
