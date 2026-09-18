---
created: 2026-09-18
updated: 2026-09-18
---

# Testing And Rollout

## Testing The Prompt Change

D1 changes what the model is sent, so the repo's rule applies: a prompt change is a behaviour change and the unit suite cannot catch a regression in judgement.

The release 3 fixture is unaffected, and this was checked rather than assumed. src/model/prompt/tests/fixtures/release-3-prompt.txt is compared against SystemPrompt.build (Model Prompt) output alone, at src/model/prompt/tests/system-prompt.test.ts:21. D1 touches no prompt section. It changes the content of an assistant message in the chat history, which that fixture never sees, so the fixture stays green and is not re-recorded.

Three checks against a real vault and a real API key.

1. A turn where the model replies with a sentence and tool calls together. Confirm the panel is unchanged, the transcript's response block holds both, and the next step's Request block shows the sentence on the assistant message.
2. The same turn continued past three steps, confirming the model does not re-narrate what it already said. Reading its own last reply in full is the new input, and the failure mode is repetition rather than an error.
3. A turn on a restored session, confirming a tool-call message written before this change reads back with empty content and behaves as it does today.

## Out Of Scope

- The applicable_skills gate taking the model's word, and a repeated identical call having no guard. Both are harness defects the transcript makes findable, and neither is made refusable here.
- The size of the step budget and what a call is charged, both settled in the archived spec 2026-09-18b-charging-a-batch-of-calls.
- The stale MAX_ITERATIONS comment, which still says the allowance is counted in tool calls. True before 103e1df and not after.
- The panel, which renders none of these lines.

## Rollout

Five commits, in build order. Each leaves the suite green.

1. ChatTurn and ChatMessage take an optional content beside their calls, and aToolTurn (Test Support) gains a sibling builder for the pair. No behaviour moves, since the defaults keep every existing call site meaning what it meant.
2. MistralMapper carries the content both ways, and StoredMessages.assistant (Session Models) reads it back. This is the behaviour change, and the point to run the three manual checks above.
3. TranscriptTurnStep.response renders text and calls together, and names the three empty cases apart.
4. IterationCounter exposes the total and the last charge, RecordedTurnStep gains its charge, ConversationTurnRunner.spendOn records it, and the budget line renders.
5. RepeatedCalls and the repeat mark.

## References

- [../2-requirements.md](../2-requirements.md) - what the transcript may grow by, and the six additions
- [../3-decisions.md](../3-decisions.md) - D1, D2 and D3 resolved, D4 and D5 closed as no change during design
- [../4-acceptance-criteria.md](../4-acceptance-criteria.md) - the five checks a person runs by hand
- [../unit-tests/1-index.md](../unit-tests/1-index.md) - the test plan
- [../../../3-archived/2026-09-18b-charging-a-batch-of-calls/2-requirements.md](../../../3-archived/2026-09-18b-charging-a-batch-of-calls/2-requirements.md) - what a step costs, and why a call count is the wrong number to render

Sites this design touches, at today's lines.

| File                                            | Line | What sits there                                        |
| ----------------------------------------------- | ---- | ------------------------------------------------------ |
| src/model/providers/models/chat-turn.ts         | 13   | ofToolCalls, which forces content to empty             |
| src/model/providers/models/chat-message.ts      | 28   | modelToolCalls, which does the same                    |
| src/model/providers/mistral-mapper.ts           | 15   | toApiMessage hardcoding content on a tool-call message |
| src/model/providers/mistral-mapper.ts           | 34   | toChatTurn returning calls or text and never both      |
| src/session/models/session-snapshot.ts          | 66   | StoredMessages.assistant, the one-line restore fix     |
| src/engine/turn/tool-call-executor.ts           | 30   | The only site appending the model's tool-call message  |
| src/engine/turn/conversation-turn-runner.ts     | 57   | ChatTurn's one production consumer                     |
| src/engine/turn/conversation-turn-runner.ts     | 73   | spendOn, the one place a batch reaches the counter     |
| src/engine/turn/spending/iteration-counter.ts   | 36   | spent, today private                                   |
| src/engine/turn/ending/turn-outcomes.ts         | 23   | exhausted, which appends nothing to the history        |
| src/session/transcript/transcript-turn-step.ts  | 66   | response, which renders nothing recorded               |
| src/session/transcript/transcript-turn-step.ts  | 112  | responseLines, which returns text or calls             |
| src/session/transcript/transcript-repository.ts | 42   | recordCall, the one step-creation site                 |
| src/test-support/builders.ts                    | 48   | aToolTurn, variadic over calls                         |
