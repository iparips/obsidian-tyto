---
created: 2026-09-17
updated: 2026-09-18
---

# Decisions

## Requirements

### D4: Does a command that opened nothing consume the step's one retarget? [resolved 2026-09-18]

No. The rule counts an actual change of target, not a call that might have caused one. Ilya: counting the move is the more reasonable reading, since the defect is the target moving.

A command can run and open no note. NoteOpenedByObsidianCommand (commands) reports rebinds() false, moveTargetNote returns early, and the target is untouched. Nothing about the step has become unsafe, so refusing what follows would spend the step on nothing.

| Option         | Cost                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Count the move | The guard reads the target rather than the call, so it runs after dispatch  |
| Count the call | A no-op command burns the step, and the next legitimate command is refused for nothing |

This costs less than it first appears. The executor already loops per call and can read the target before and after each one, so a changed path is observable without the dispatcher reporting it. The guard sits after dispatch instead of before, which is where the edit rule sits, so the two stop mirroring each other exactly. Which target it reads is the design's call, settled in D5.

One consequence to design around: the refusal can only be issued to calls after the move, so the executor decides per call rather than once per batch.

### D1: Does the rule refuse a second command, or every retargeting call? [resolved 2026-09-18]

Every retargeting call. The defect is the target moving after the note was read, so what moved it does not matter: run_command and open_note both reach moveSessionTargetNoteTo and both break the step the same way.

Naming the pair after what they do also survives a third tool arriving, where a rule written around run_command would silently miss it.

| Option                        | Cost                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| Both, as one "retargets" rule | A predicate spanning two tools, named for what they do     |
| run_command alone             | open_note keeps the hole; a shortlist pick can still batch |

### D2: Is a command and an edit in one step allowed? [resolved 2026-09-18]

No. ModelService (engine turn) reads the note once at the start of a step, so an edit batched after a retarget was anchored against the previous note's text. The model cannot anchor against a note it has not been shown, and a command's destination is Obsidian's to decide, so it cannot anchor ahead either.

Allowing the pair would need the note re-read mid-step and the model given a chance to anchor against it. That is a round trip, which is a step. One note per step is what the read-once design means rather than a limit imposed on top of it.

The cost is the step count. Three notes runs to roughly six steps against a cap of 20, per IterationCounter (engine turn spending).

### D3: Does a refused retarget still count against the step budget? [resolved 2026-09-18]

Yes, and nothing changes. ConversationTurnRunner.spendOn spends iterationCounter.spend(calls.length) over the whole batch after the executor returns, so a refused second edit already spends today. The new refusal inherits that.

The accounting stays wrong on its own terms: a batch of three commands spends three where one ran. Correcting it means the executor returning a count the runner branches on, which is a new return shape for an error of two steps in twenty, on a shape costing about six. The counter's own comment defends the current number, since it counts tool calls so the total matches the numbered progress lines the user reads, and a refused call does publish one.

| Option                        | Cost                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| Spend per call, as today      | A refused batch overspends by the calls it refused                   |
| Spend per call dispatched     | A new return shape on executeToolCalls, and the panel count stops matching the spend |

Revisit if a real turn lands near the cap. The acceptance check watching for twelve steps is what would surface it.

### Assumptions

- The model will interleave once refused. Both transcripts show it complying with the single-edit rule on the step after a refusal, so the same feedback shape is expected to work here. If it keeps batching and taking the refusal, the fix is not a rule but a prompt that stops it planning the whole turn up front, and the design's seam moves to the prompt.
- No legitimate turn retargets twice in one step. A skill reading one note to decide what to write in another would, but the skills here name a single note each. If one appears, the rule needs an exemption for a read-only open, which does not exist as a distinct call today.
- mistral-medium-latest is representative enough to test against. It is the model both failures were observed on, and its instruction-following is weaker than the frontier models', so a rule that holds here should hold above. If behaviour differs by model, the acceptance checks need running on more than one and the prompt wording carries more of the weight.
- Auto mode is the shape most multi-note turns will run in. It resolves a lone candidate without parking, per NoteChoiceService.singleMatch, so a turn reaching three notes by search costs no interactions. Confirm mode works too and parks on each pick. If most users stay on confirm, a multi-note turn is three prompts, and the feature wants one shortlist offering several notes, which is its own spec.

## Design

### D5: Which target does the guard compare, the session's or the turn's? [resolved 2026-09-18]

The session's. ToolDispatcher.moveSessionTargetNoteTo binds the session unconditionally and only calls turnRepository.retargetTo when the path resolves, so a retarget that bound but did not resolve moves SessionRepository.targetNote() and leaves TurnRepository.targetNote() where it was.

That case is still a moved target. The turn holds an unwritable path, the note the step was read against is no longer writable, and an edit after it is exactly what the rule exists to stop. Reading the turn's note would let it through.

| Option                       | Cost                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| SessionRepository.targetNote | A plain string compare; catches a bind that did not resolve              |
| TurnRepository.targetNote    | Misses an unresolvable retarget, and compares OpenNote identity not path |

### D6: Do the edit rule and the retarget rule keep the same shape? [resolved 2026-09-18]

No, and the edit rule does not move. They stay one loop with two guards: the edit rule reads a ToolCall before dispatch, the retarget rule reads the target around dispatch.

Moving the edit rule after dispatch to match would mean running the second edit to discover it was a second edit, which is the duplicated write the rule prevents. The asymmetry belongs to the domain: an edit declares itself in its name, and a retarget cannot, because Obsidian decides what a command opens.

| Option                          | Cost                                                             |
| ------------------------------- | ---------------------------------------------------------------- |
| Two guards, different shapes    | The loop holds two pieces of per-step state, and they read unlike |
| Move the edit rule after dispatch | The second edit applies before it is refused                    |

### Assumptions

- Every call after a move is worth refusing, not only an edit or a second retarget. A read or a search after a move answers against a target the model no longer holds, and narrowing the rule would need a second predicate naming which calls tolerate a moved target. If a real turn is blocked by a refused read, that predicate is the change.
- No tool outside run_command and open_note moves the target without going through moveSessionTargetNoteTo. Both reach it today and the guard watches the target rather than the call, so a third tool is covered on arrival. If one binds the session directly instead, the guard misses it and the fix is to route it through the same method.
