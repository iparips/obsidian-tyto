---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Decisions

## Requirements

### Decisions

#### D4: Does applicable_skills get promoted from call level to step level? [resolved 2026-09-18]

It stays at call level, and nothing changes. Ilya: applicable_skills should render per tool call, not per step.

The premise the option table rested on was that the value needed surfacing. It does not. It is an argument on the call, `toolCallLines` prints the whole argument object, so a guarded call already renders its declaration in the JSON block beneath it. Promoting it would move a value away from the thing it is a property of.

| Option                                     | Cost                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| A step-level line naming what was declared | Duplicates a value the call JSON below it already shows, on every step that sent a guarded call |
| Leave it at call level, in the JSON        | The third read that cost the session time stays the cost of finding it                          |
| Promote only a declared empty list         | One line on the steps where the class of failure is possible, and none elsewhere                |

The second option is the one taken. What the three defects cost was the time to skim a JSON block, which is a cost of reading rather than of the record missing anything, and the per-step line allowance D2 spends on the budget is better spent there.

The bound the requirements set is met for free. A declared `[]` and an omitted argument must not render alike, since `ToolCall.declaresArgument` distinguishes them and `SkillDeclarationChecker` turns on the distinction. The JSON renders the difference exactly: an omitted argument has no key.

The acceptance-criteria check that asked to see the declaration without opening the call's arguments comes out rather than being rewritten, per its own note.

#### D5: How does a reader tell two transcripts cite the same prompt? [resolved 2026-09-18]

Nothing, which its own entry flagged as a real answer here.

| Option                               | Cost                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| A hash of each part's text           | Stable across builds of the same text, and adds an opaque token to every citation                                                           |
| A plugin build stamp in the metadata | One line for the whole transcript, and two transcripts of the same code differ, which matters if a transcript is ever compared as a fixture |
| Nothing                              | The near-miss this session had twice stays possible                                                                                         |

The appendix already writes every part's full text under its version, and `TranscriptAppendix.part` writes a later version as a diff against the one before it. Two transcripts are therefore compared by diffing their appendices, which answers the question exactly rather than by proxy.

The near-miss was a reader trusting a version number rather than reading the text beneath it. An identifier would make that trust safe, and the cost is per part and per citation on every transcript, paid by every reader to protect against one habit. A reader who compares the text is right whatever the identifier says.

What would reopen it: a transcript compared mechanically rather than read, which is the one case a diff of prose does not serve. Nothing does that today.

#### D1: Is the dropped reply text fixed at the provider boundary, or only marked in the transcript? [resolved 2026-09-18]

Carry the text through ChatTurn and ChatMessage. Ilya: a transcript that marks the loss still cannot diagnose the turn, and the words are the thing the reader needs.

So this spec reaches outside the transcript package, and the two halves ship together: the text has to survive the provider boundary and the history before the transcript has anything to render.

| Option                                                 | Cost                                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carry the text through ChatTurn and ChatMessage        | Touches the provider boundary and the session history, and the text then reaches the next model call as part of the assistant message, which changes what the model is sent |
| Keep the text for the transcript only                  | A second store of the model's words beside the history, which is what response() was written to avoid                                                                       |
| Mark the step as having carried text that was not kept | Honest and cheap, and leaves the words unrecoverable for the reader who needs them                                                                                          |

What the investigation found, which the design builds on.

- The loss is symmetric, and the outbound half is the one the option table missed. MistralMapper.toApiMessage (Model Providers) hardcodes content to empty on any message carrying tool calls, so a text kept in the history would still be stripped on the way back to the model. Both directions change or neither does.
- ChatTurn (Model Providers) has one consumer in production: ConversationTurnRunner.runTurnStep (Engine Turn) at lines 57 to 59, which branches on isText and otherwise reads calls. The either/or is a deliberate invariant from 5b44191, "a tool turn cannot carry content", chosen for type safety rather than because the provider forbids the pair.
- The restore path needs one line, not a schema change. StoredMessages.of (Session Models) already persists content for every message including a tool-call one; StoredMessages.assistant reads it back only when there are no calls. SESSION_SNAPSHOT_VERSION does not move, since a record written before this carries an empty string, which is exactly today's behaviour.
- Neither toChatTurn nor toApiMessage has a unit test. The mapper's suite covers fileNameFor alone, so both sides of the drop are currently unguarded.
- The 149 test call sites reach these through two builders, aToolTurn and ChatMessage.modelToolCalls, so the blast radius is the builders rather than the call sites. aToolTurn (Test Support) is variadic over calls, so it cannot take an optional trailing text and needs a second builder or a different shape.

What the design still has to settle, and what makes this a behaviour change rather than a refactor: sending the text back to the model on the next step changes what the model reads of its own last reply. That is a prompt change under the repo's rule, so it is tested against a real vault and a real key, and the release 3 fixture is checked rather than assumed unaffected.

#### D2: What does the step budget line say, and where does it sit? [resolved 2026-09-18]

Running total and budget on every step. Ilya: it is the most informative of the three, and the budget is the thing a reader is tracking while they read the turn rather than after it.

A step costs one for the round-trip plus half for each call after the first, accumulated fractionally and rounded only when read. IterationCounter (Engine Turn Spending) holds all of that and exposes isSpent, justRanLow, warning and max. It exposes neither the running total nor the charge for one step.

| Option                                          | Cost                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Running total and budget on every step          | One line on every step of every turn, including the turns that went fine                   |
| The step's own charge only                      | A reader adds up the column themselves, which is the hand-tally that cost the session time |
| Total and budget on the step that ends the turn | Free on a turn that went fine, and says nothing while the turn is the thing being read     |

What this settles for the recording, which is why it was blocking. The charge has to be recorded when the call is charged: the transcript is built from RecordedTurnStep (Session Transcript), and a spend read at export time would be the whole session's rather than the step's. ConversationTurnRunner.spendOn (Engine Turn) at line 73 is the one place a batch's size reaches the counter, and it is called after the calls run, so the recorded step gains a field written there rather than at recordCall.

Three things the design has to get right in the wording.

- The total is fractional under the hood and rounded only when read. A turn eleven steps in may hold a total that is not a whole number of anything a reader can see, and rounding each step as it renders would not sum to the rounded total the ending reports. Render the rounded running total, and let the step's own charge be the number that carries a half.
- A step's charge and its call count differ whenever the reply batched, which is the case the line exists for. A line saying 16 of 20 above a step listing four calls must not read as a contradiction, so the line says what was charged rather than what was counted.
- The budget line is the one addition that renders on every step, so it is the whole of this spec's per-step allowance. Where a repeat mark or a skill declaration also fires on a step, they share that line rather than adding a second.

This is the per-step budget from the requirements spent in full and deliberately. A turn that went fine pays one line a step for a record that reads the same way as the turn that did not.

#### D3: Does a marked repeat compare against the turn, or the session? [resolved 2026-09-18]

Within the turn, and the same call is only a repeat where it returned the same thing. Ilya: a repeat may pick up different things at different times, because the turn can change the state the call reads.

The worked case is one turn, not two.

```text
grep x   -> nothing
write x
grep x   -> a hit
```

Both greps are identical in name and arguments. The second is not a loop, it is the model confirming the write landed, and marking it as a repeat would tell a reader the turn went nowhere on the step where it did the most.

So identical arguments are necessary and not sufficient. The mark compares what came back as well as what went out, which the transcript already holds: the tool result of each call sits in the next step's request block, and an edit between them shows as a progress line under Harness.

| Option                                     | Cost                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Within the turn, same call and same result | Marks the loop and not the confirmation, at the cost of comparing two results rather than two argument lists |
| Within the turn, same call                 | Marks the grep that confirmed a write, which is the opposite of what the mark means                          |
| Across the session                         | Also marks a legitimate second search in a later turn, and the mark stops meaning loop                       |

The turn is the right window for the same reason the budget is per turn: it is the unit a defect is diagnosed in, and a model that sends the same grep in turn one and again in turn three is answering two utterances rather than looping.

What the design has to settle: what counts as the same result. Byte equality is the cheap reading and is probably right, since the loop this exists for sent the same call and got the same "nothing matched" each time. A grep that returns the same hits in a different order, or a result carrying a trimming line naming a total that moved, would defeat byte equality and neither has been seen.

### Assumptions

- ~~The "nothing recorded" symptom is the truncation in TranscriptTurnSection.answered.~~ Corrected during design on 2026-09-18, and the requirements were corrected with it. The truncation is not the cause. Exhausted, Stuck and Failed append nothing to the history at all, since TurnOutcomes builds them and only TurnEndingService writes, so lastModelNoteAt finds no model note and cuts nothing. The truncation fires on Cancelled alone, where it does what it was written to do. A realistic exhausted turn renders its last step's calls today, which was reproduced against the current code.
- The session that reported the symptom on "the step that ended a turn" saw steps whose provider call failed, which is the one path that leaves an empty slice. If any of those transcripts showed the symptom on a step that did reach the model, a mechanism beyond the two the requirements now name exists and the empty-slice wording is treating a defect as a fact.
- A search reason reaches the transcript through the tool result in the next step's request block, so no transcript change is needed to carry it. This holds only while a reason exists for the case at hand: SearchReport (Search) names four, and a well-formed pattern that simply misses still says only that it missed. A defect turning on a fifth case would need the harness fix, not a transcript one.
- Marking a repeat is formatting over data the transcript already holds, so it needs nothing recorded that is not. Confirmed during design: ToolCallExecutor appends every result as a ChatMessage.toolCallResult carrying the call's id, so a result is attributable to its call by id and the same-call-and-same-result test D3 settled is computable at export time.

## Design

### Decisions

None open. D4 and D5 closed above as no change, and the design records both as decisions rather than as gaps.

### Assumptions

- Relaxing ChatTurn's either/or invariant is safe because the branch reading it is one line. ConversationTurnRunner.runTurnStep at line 57 asks isText and otherwise reads calls, so a turn carrying both runs its calls and keeps its text, which is what D1 wants. If a second consumer appears that treats the two kinds as exclusive, the invariant has to move into that consumer rather than back into the type.
- A step whose provider call failed is the only path leaving an empty response slice. The design's wording turns on that: it says the provider call did not return, which is a claim about why. If another path can empty a slice, a step of that kind is mislabelled, which is why the charged-but-empty case keeps the old wording as a fallback rather than collapsing into the new one.
- Byte equality is the right test for "the same result", per D3's own note. The loop the mark exists for sent the same call and got the same miss each time. A result whose hits come back in a different order, or which carries a trimming line naming a total that moved, would defeat it, and neither has been seen. If one is, the test needs normalising and the mark's cost moves.
