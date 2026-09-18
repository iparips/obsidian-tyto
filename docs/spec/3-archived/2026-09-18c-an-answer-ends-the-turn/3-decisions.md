---
created: 2026-09-18
updated: 2026-09-18
---

# An Answer Ends The Turn: Decisions

## Requirements

### Decisions

#### D1: How does the panel learn not to write an assistant entry? [resolved 2026-09-18]

The ending kind travels back beside the outcome, and the panel branches on it. Ilya: take the first option.

SessionPanel.runTurn (Session Views) branches on the outcome's shape and nothing else: a success dispatches summary, which PanelReducer (Session Models) turns into an assistant entry, a cancel dispatches turnCancelled, and anything else dispatches failed. Three shapes, three branches. An answer-ended turn is a success, so it takes the first branch and writes the entry this spec exists to remove.

So the panel needs a fourth thing to branch on, and the decision was what carries that fact.

| Option                                     | What the panel branches on                      | Cost                                                                           |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Return the ending kind beside the outcome  | The kind, which says the turn answered          | run returns a pair where it returns one value, and every caller reads the pair |
| Add a fourth Outcome variant, answered     | The outcome's own type, as cancelled works      | A new variant on a type shared by everything that returns an Outcome           |
| Keep three shapes, change the success text | Nothing new; it still writes an assistant entry | Does not fix the defect, only shortens the duplicate                           |

The third row is not a solution and is recorded to be ruled out. It is the cheapest change and the one a build reaches for first, and all it does is shorten the duplicate.

The first row wins on having nothing to invent. ConversationTurnRunner.run (Engine Turn) already holds an EndedTurn carrying both the kind and the outcome, and drops the kind when it returns; recordEndingAndGetOutcome is the method that drops it. Returning both exposes what the runner has. The second row would add a variant to Outcome (Shared Models), which everything returning an Outcome shares, for a fact only one caller reads.

This closes D2 as well. The kind the panel branches on is the kind the transcript records, so the two read one fact rather than a kind for the transcript and a flag for the panel.

Three things follow for the build.

- EditEngine.processUtterance (Engine) and UtteranceQueue (Engine) sit between the runner and the panel, so whatever run returns passes through both. The pair has to survive that path, and the queue's promise type changes with it.
- The notice still fires. notifySucceeded is the only thing telling a user whose panel is off screen that the turn finished, so an answered ending dispatches no entry and notifies anyway. What text the notice carries is the design's call.
- The answer text still reaches the history, per D4. The panel not rendering it and the history keeping it are separate consequences of the same ending.

#### D2: Is there a new TurnEndingKind, or does this reuse Replied? [resolved 2026-09-18]

A new kind, Answered. It follows from D1 rather than being decided separately: the panel branches on the kind, so reusing Replied would leave it unable to tell the ending it must not render from the one it must.

| Option               | Cost                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| A new kind, Answered | A sixth value, and every exhaustive read of the enum gains a branch         |
| Reuse Replied        | The panel cannot tell the two endings apart, and neither can the transcript |

Two other things pointed the same way before D1 settled it.

- The transcript reads the ending off this enum rather than inferring it, which is what the enum is for. Reusing Replied says a cited answer and a bare text reply are the same ending, and a reader cannot recover the difference.
- The ending writes to the chat history, per D4, so it is a TurnEndingService (Engine) method beside endTurnWithModelUtterance rather than a TurnOutcomes (Engine Turn Ending) one. That service pairs each method with the kind it returns, and a second method returning Replied makes the kind stop naming which method produced it.

Two files record the five endings and both gain the sixth: turn-ending-kind.ts, and the endings table in the vocabulary doc. TranscriptRepository.recordEnding (Session Transcript) is the only consumer today, and SessionPanel (Session Views) becomes the second.

#### D3: What happens to the calls beside the answer in the same batch? [resolved 2026-09-18]

Every call in the batch runs, then the turn ends. Ilya: the history staying well-formed is what decides it.

ToolCallExecutor.executeToolCalls (Engine Turn) loops every call in the reply and returns nothing about any of them. The runner then checks the refusal counter and spends the allowance. So an ending discovered mid-batch has to decide about the calls after it.

- Stop the loop at the answer, discarding the calls after it. They were sent and the model expects results, so the chat history gains a tool call with no result, which is a malformed history for the next turn to read.
- Run every call, then end the turn. The history stays well-formed, every call the model made is accounted for, and the ending is decided once the step is complete. This is also what the current loop does minus the ending.
- Refuse an answer that arrives beside other calls. Turns a working turn into a refusal for a shape the schemas never warned against.

The third is recorded because it is a real reading of "an answer is terminal" and someone will propose it. It trades a well-formed turn for a rule the model was never told.

This constrains the design rather than only the behaviour. The ending cannot be a return that breaks the executor's loop early, since that is the first option under another name. The fact has to survive the rest of the batch and be read once the step is complete.

Whether a batch mixing an answer with an edit is a defect of its own is a separate question, and this spec does not answer it. Nothing stops the model sending answer_from_search beside write_note today, and that turn writes a note and answers about it in one step. Ending the turn does not make it worse, and it is out of scope here rather than settled.

#### D4: Does the chat history gain anything when an answer ends a turn? [resolved 2026-09-18]

The answer text is appended as a model message, so the history keeps the good copy rather than the restated one. Ilya: the history gets both today, and that is the thing being fixed.

Both blocks in the observed turn come from the same second step. It publishes nothing to the panel that the answer block did not already carry, and it appends its restatement to the chat history through TurnEndingService.endTurnWithModelUtterance (Engine). So the duplicate on screen and the history entry are one defect seen twice, not a defect and a service.

That makes the choice narrower than it first reads. The question is not whether the history keeps something, but which of the two copies it keeps.

| Copy                     | Carries                                   | What the next turn reads         |
| ------------------------ | ----------------------------------------- | -------------------------------- |
| The answer, as published | The full finding, cited, with its sources | What the turn actually concluded |
| The model's restatement  | The same headings, uncited, detail cut    | The finding minus its evidence   |

The restatement is strictly worse and it is what the history holds today. The observed turn makes that concrete: both blocks carry the same ten headings in the same order, and the one the history keeps is the one with the citations removed. Ending on the answer and appending the answer text replaces it with the better copy, so the next turn is better informed than it is now rather than worse.

The vocabulary doc's property that an answer never reaches the chat history does not survive this, and should not. It was true because a Replied ending always followed and put a summary there; it described a consequence of the old ending rather than a rule about answers. The doc's table of entry kinds is updated as part of the build, since the ending it rests on is what changed.

Two things this settles for the rest of the spec.

- The ending belongs to TurnEndingService (Engine), not TurnOutcomes (Engine Turn Ending). The split between those two classes is whether the ending writes to history before returning, and this one does. D2 inherits that: the kind and the service method travel together.
- The sources are not appended. The history takes the answer text alone, since the paths are an accounting for the reader to click rather than something the next turn acts on, and PathsReturnedByVaultRepository (Engine Turn) is session-scoped and already holds them.

### Assumptions

- No consumer of ConversationTurnRunner.run (Engine Turn) other than the panel path reads the returned string. EditEngine.processUtterance (Engine) passes it straight through the utterance queue, and SessionPanel (Session Views) is the one caller. If a second consumer exists, D1's options are costed wrong and the design finds it.
- The model calls answer_from_search once per turn in practice. Nothing enforces it and nothing here needs it enforced: the first call ends the turn, so a second in the same batch publishes a second answer block and the ending is already decided. If real turns publish two answers regularly, the panel showing both is a separate defect.
- Whether the duplicate reply actually stops is a judgement a vault run makes, not a unit test. The suite can prove the loop stops after the call; only a real turn says whether the user now reads the finding once. That is why the acceptance criteria carry it.
- The system prompt needs no change for this to work. This is stronger than an assumption on the half that matters: the observed turn shows the model holding the "say nothing further" result in context and restating anyway, so wording the rule again is known not to work rather than merely doubted. What stays assumed is the other direction, that the model will not route around a hard ending by replying in text instead of calling the tool. If a vault run shows that, the prompt becomes the second half of the fix and is its own spec.

## Design

### Decisions

#### D5: Which answer ends the turn when a batch carries two? [resolved 2026-09-18]

The first. D3 already settles that every call runs, so the question is only which one's text the ending appends, and the first is the one the reader saw first.

| Option            | Cost                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| The first answer  | Nothing; the executor holds the first and ignores later ones            |
| The last answer   | Reads as arbitrary, and the panel already showed the first above it     |
| Refuse the second | A refusal for a shape the schemas never warned against, as D3 ruled out |

Both blocks still render, since publishing is per call and happens in the dispatcher. The requirements' assumption is that the model answers once, so this is a tie-break rather than a behaviour anyone should see.

### Assumptions

- Returning a string from ToolCallExecutor.executeToolCalls (Engine Turn) rather than a value object is enough. It carries one fact and the runner reads it once, so a union of states would be shape copied without its reason. A second terminal tool would change that, and none is in scope.
- No consumer of EditEngine.processUtterance (Engine) outside the panel path reads its return. The requirements assumed this of the runner; the design checked it, and SessionPanelPropsBuilder (Wiring) at src/wiring/session-panel-props-builder.ts:179 is the one production caller, passing it straight through.
