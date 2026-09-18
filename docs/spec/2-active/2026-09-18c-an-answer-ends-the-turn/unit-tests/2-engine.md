---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: Engine Tests

The three engine classes the change touches: the batch loop, the step that ends on it, and the ending that appends the answer.

## ToolCallExecutor

### executeToolCalls

```text
append the model's tool calls to the history
answer = null
for each call in the batch
  run the call as today, appending its result
  if the outcome carries an answer and answer is null
    answer = that answer
return answer
```

Tests go in src/engine/tests/edit-engine-harness.test.ts, under its existing "when the turn answers from a listing" describe block. The two tests there assert the answer reached the panel and no edit landed; both still pass, because respondsWith falls through to a text turn the loop now never asks for. The new leaves are what that fall-through was hiding.

```text
the batch holds one answer
  ends the turn on the step that answered
  makes no further model call
the batch holds an answer and a later call
  runs the later call and appends its result
  ends the turn once the step is complete
the batch holds two answers
  publishes both answer blocks to the panel
  appends the first answer to the history
the batch holds an answer and two identical refusals
  ends the turn as stuck rather than as answered
the batch holds no answer
  keeps the turn going, as today
```

## ConversationTurnRunner

### executeToolCalls

```text
answer = await toolCallExecutor.executeToolCalls(calls, refusals)
if refusals.isStuck() return TurnOutcomes.stuck(refusals)
spendOn(spend, calls.length)
if answer return turnEndingService.endTurnWithAnswer(answer)
return TurnStepOutcomes.keepGoing()
```

Tests go in src/engine/tests/conversation-turn-runner-endings.test.ts, beside the five ending describe blocks it holds. Its endings() helper reads the recorded kinds, which is what these assert.

```text
the model answers from search
  records the ending as answered rather than as replied
  charges the answering batch its calls and no further step
the model answers from search beside two identical refusals
  records the ending as stuck
the model answers in text
  records the ending as replied, unchanged
```

### recordEndingAndGetResult

```text
transcriptRepository.recordEnding(endedTurn.kind)
return TurnResult.ofEndedTurn(endedTurn)
```

One leaf, in the same file: the returned result carries the kind the transcript recorded. The five existing ending tests cover the recording itself, so this asserts only what the rename adds.

```text
returns the kind beside the outcome for every ending
```

## TurnEndingService

### endTurnWithAnswer

```text
sessionRepository.appendChatMessage(ChatMessage.model(answer))
return endedTurn(Answered, Outcomes.success(answer))
```

Tests go in src/engine/tests/edit-engine-harness.test.ts, in the answers-from-a-listing block, since the history is what they read.

```text
appends the answer text as a model message
appends no sources beside it
moves no cursor, since the turn wrote nothing
```
