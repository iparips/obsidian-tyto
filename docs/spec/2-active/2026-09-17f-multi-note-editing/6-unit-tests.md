---
created: 2026-09-18
updated: 2026-09-18
---

# Unit Tests

The plan for [5-design-stable-step-target.md](5-design-stable-step-target.md). The checks a person runs by hand are in [4-acceptance-criteria.md](4-acceptance-criteria.md), since whether the model then interleaves its opens and edits is a judgement no unit test makes.

## Where the cases go

Three files, split by what each already wires. None of the three needs a new fake.

| File                                   | Carries                                          | Why there                                             |
| -------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| edit-engine-harness.test.ts            | The run_command cases, including opened nothing  | Already drives a command that opens a note, and one that opens none |
| edit-engine-model-chosen.test.ts       | The open_note cases                              | Already runs glob, choose and open end to end          |
| edit-engine.test.ts                    | The single-edit rule, unchanged                  | The three-edit batch stays as the regression it is     |
| system-prompt.test.ts                  | The prompt line, if it lands                     | Holds the release 3 fixture assertion                  |

The harness file's second note is DAILY, and its opensDailyNote helper rebinds executeCommandById to finish the open. A second command opening a second note needs one more registered command and one more note in the locator, which is the only new wiring in the plan.

## ToolCallExecutor.executeToolCalls

```text
targetAtLastCall = session.targetNote()
editApplied = false
for each call:
  if session.targetNote() != targetAtLastCall:
    refuse, naming both paths; do not record against refusals
  else if call.isEditTool() and editApplied:
    refuse with the one-edit reason; do not record against refusals
  else:
    dispatch, append the result, store the edit end, record the refusal
    editApplied = editApplied or call.isEditTool()
  targetAtLastCall = session.targetNote()
```

The move is read after every call rather than only after a dispatch, so a refused call cannot leave the comparison stale.

### Test outline

```text
a batch of two commands, each opening a note
  runs the first command and leaves the target on the note it opened
  refuses the second, so the second note is never bound
  names both paths in the refusal the model reads
  publishes a refused line for the second command
  keeps the turn going rather than ending it stuck
a batch of two open_note calls, both paths chosen
  opens the first and leaves the target on it
  refuses the second, so the target does not move twice
a command that opens a note, then an edit
  runs the command
  refuses the edit, since the target moved ahead of it
  leaves both notes unwritten
a command that opens no note, then an edit
  runs the command
  applies the edit to the note the step was read against
  publishes no refusal for the move, since the target never moved
a command that opens no note, then a second command that opens one
  runs both, since nothing had moved when the second was dispatched
a batch of three commands, each opening a note
  refuses the second and third
  keeps the turn going, since neither refusal is recorded against RepeatedRefusalCounter
an edit, then a command that opens a note
  applies the edit to the step's note
  runs the command, since the target had not moved when it was dispatched
a batch of three edits, target unmoved
  applies the first only
  keeps the turn going
a search call, then an edit, target unmoved
  applies the edit, since only a move or a second edit refuses
a retarget to a path that will not resolve, then an edit
  refuses the edit, since the session moved even though the turn's note did not
```

The three-edit batch and the search-then-edit case already exist in edit-engine.test.ts. They are listed because the new guard runs ahead of the edit rule on every call, so both must stay green unchanged.

The last case is the one the design's read choice turns on. It fails if the guard reads TurnRepository.targetNote (Engine Turn) instead of SessionRepository.targetNote (Session), because an unresolvable retarget leaves the turn's note in place. Drive it with a command opening a path the note locator does not hold.

The second no-op case guards against the guard latching. A step that refused nothing must still dispatch everything after a call that moved nothing.

## ModelsRole.widenedReach

Only if the prompt line lands, per the design's rollout step 3.

```text
reach line for a vault with commands or search
  states the one-note-per-step shape
reach line for a vault with neither
  omits it, so the release 3 fixture is unchanged
```

The existing fixture assertion covers the second line already; it is named here so a change that moves the line out of widenedReach is caught as a fixture failure rather than a surprise.
