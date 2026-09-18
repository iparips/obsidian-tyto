---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: Docs, Scope And Rollout

The architecture claims the change falsifies, what it leaves alone, the commit order, and the sites it touches.

## Documentation corrections

Two claims in docs/architecture/2-vocabulary.md stop being true, per D4, and both are part of this change.

- The endings table gains Answered: the model answered from search, and the panel shows an answer entry. Five endings becomes six in the heading prose and in the 4-the-turn.md reference line that counts them.
- The entry-kinds prose says an answer never reaches the chat history. That held because a Replied ending always followed and put a summary there. The three ways an assistant entry and an answer entry differ become two: an assistant entry is the turn's ending and happens once, where an answer is a tool result and can happen any number of times. Both now reach the chat history.

docs/architecture/4-the-turn.md needs one more edit. Its How A Turn Ends table describes the returned type as Outcome of string, which is now TurnResult carrying that outcome beside the kind, and the Why The Ending Returns Rather Than Publishes section still holds unchanged.

## Out of scope

- Telling the model in the prompt that answering ends the turn. Out of scope in the requirements, and the result text losing its say-nothing-further instruction is not a prompt change: it is a tool result the model no longer has a step to read.
- A batch mixing an answer with an edit. D3 leaves whether that is a defect unanswered, and this design keeps the turn well-formed either way.
- A second answer in one batch getting its own panel treatment. Both blocks render, per the requirements' assumption that the model answers once.

## Rollout

1. ToolCallOutcome.answered (Engine, new), TurnEndingKind.Answered (Engine Turn Ending, new) and TurnEndingService.endTurnWithAnswer (Engine, new). Nothing calls them yet, so the suite stays green.
2. ToolCallExecutor.executeToolCalls (Engine Turn) returning the batch's first answer, and ConversationTurnRunner.executeToolCalls (Engine Turn) ending the turn on it. The loop now stops on an answer.
3. TurnResult (Engine Turn Ending, new) along the runner, EditEngine and UtteranceQueue path.
4. turnAnswered (Session Models, new) and the SessionPanel branch. The duplicate entry is gone from here.
5. TranscriptTurnSection.answered (Session Transcript) keeping the tail whole for Answered.
6. The two architecture docs.

## References

- [2-requirements.md](../2-requirements.md) - the duplicated answer and the six scenarios
- [3-decisions.md](../3-decisions.md) - D1 the returned pair, D2 the new kind, D3 the whole batch running, D4 the history keeping the answer
- [4-acceptance-criteria.md](../4-acceptance-criteria.md) - the vault checks, since whether the model would have talked again is a judgement
- src/engine/tool-call-outcome.ts:7 - the five facts a call carries today
- src/engine/tool-dispatcher.ts:202 - publishModelAnswer, the one line that changes here; askUser at :231 is the shape that must not
- src/engine/turn/tool-call-executor.ts:29 - executeToolCalls, the loop that returns void
- src/engine/turn/conversation-turn-runner.ts:35 - run, and recordEndingAndGetOutcome at :40 dropping the kind
- src/engine/turn/conversation-turn-runner.ts:62 - executeToolCalls, where the stuck check and the spend sit
- src/engine/turn-ending-service.ts:25 - endTurnWithModelUtterance, the method the new one sits beside
- src/engine/turn/ending/turn-ending-kind.ts:5 - the five endings
- src/engine/turn/ending/turn-step-outcome.ts:12 - EndedTurn, which already holds the kind beside the outcome
- src/engine/edit-engine.ts:41 - processUtterance, and runTurn at :45 building the failure for a runner that could not be built
- src/engine/utterance-queue.ts:15 - enqueue, whose promise type moves with the runner's
- src/session/views/SessionPanel.tsx:81 - runTurn and its three branches
- src/session/models/panel-reducer.ts:23 - the summary case, which turnAnswered is minus the entry; the answer case at :51 leaves the phase alone
- src/session/transcript/transcript-turn-section.ts:93 - answered, the site outside the enum that assumes five endings
- [docs/architecture/2-vocabulary.md](../../../../architecture/2-vocabulary.md) - the endings table and the entry-kinds prose this corrects
- [docs/architecture/4-the-turn.md](../../../../architecture/4-the-turn.md) - how the ending reaches the panel as a returned value
