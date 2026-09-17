---
created: 2026-09-17
updated: 2026-09-18
---

# Decisions

## Requirements

### D3: Does a refused retarget still count against the step budget? [open]

IterationCounter spends per call, and refuseSecondEdit publishes a progress line without dispatching. A batch of three commands would then spend three where one ran.

Not blocking: the interleaved shape uses about six steps of 20, so the accounting is wrong before it is expensive.

### D4: Does a command that opened nothing consume the step's one retarget? [resolved 2026-09-18]

No. The rule counts an actual change of target, not a call that might have caused one. Ilya: counting the move is the more reasonable reading, since the defect is the target moving.

A command can run and open no note. NoteOpenedByObsidianCommand (commands) reports rebinds() false, moveTargetNote returns early, and the target is untouched. Nothing about the step has become unsafe, so refusing what follows would spend the step on nothing.

| Option         | Cost                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Count the move | The guard reads the target rather than the call, so it runs after dispatch  |
| Count the call | A no-op command burns the step, and the next legitimate command is refused for nothing |

This costs less than it first appears. The executor already loops per call and can read turnRepository.targetNote() before and after each one, so a changed path is observable without the dispatcher reporting it. The guard sits after dispatch instead of before, which is where the edit rule sits, so the two stop mirroring each other exactly.

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

### Assumptions

- The model will interleave once refused. Both transcripts show it complying with the single-edit rule on the step after a refusal, so the same feedback shape is expected to work here. If it keeps batching and taking the refusal, the fix is not a rule but a prompt that stops it planning the whole turn up front, and the design's seam moves to the prompt.
- No legitimate turn retargets twice in one step. A skill reading one note to decide what to write in another would, but the skills here name a single note each. If one appears, the rule needs an exemption for a read-only open, which does not exist as a distinct call today.
- mistral-medium-latest is representative enough to test against. It is the model both failures were observed on, and its instruction-following is weaker than the frontier models', so a rule that holds here should hold above. If behaviour differs by model, the acceptance checks need running on more than one and the prompt wording carries more of the weight.
- Auto mode is the shape most multi-note turns will run in. It resolves a lone candidate without parking, per NoteChoiceService.singleMatch, so a turn reaching three notes by search costs no interactions. Confirm mode works too and parks on each pick. If most users stay on confirm, a multi-note turn is three prompts, and the feature wants one shortlist offering several notes, which is its own spec.
