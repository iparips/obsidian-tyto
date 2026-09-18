---
created: 2026-09-18
updated: 2026-09-18
---

# Behaviour Sequence

One diagram, since there is no flag to branch on. It covers the two paths the change touches: a reply carrying both text and calls, and a step whose provider call failed.

```mermaid
sequenceDiagram
    participant Runner as ConversationTurnRunner [Engine Turn]
    participant Model as ModelService [Engine Turn]
    participant Mapper as MistralMapper [Model Providers]
    participant Transcript as TranscriptRepository [Session Transcript]
    participant Executor as ToolCallExecutor [Engine Turn]
    participant Session as SessionRepository [Session]
    participant Counter as IterationCounter [Engine Turn Spending]

    Runner->>Model: askModel
    Model->>Transcript: recordCall
    Note over Transcript: The step is recorded before the call, so a failed step still says what it was sent
    Model->>Mapper: toChatTurn

    alt "the reply carried text and tool calls"
        Mapper-->>Model: ChatTurn
        Note over Mapper: Both are kept. Today the content is discarded here
        Model-->>Runner: Outcome of ChatTurn
        Runner->>Executor: executeToolCalls
        Executor->>Session: appendChatMessage
        Note over Session: The text reaches the history, so the transcript and the next step both see it
        Executor-->>Runner: void
        Runner->>Counter: spend
        Runner->>Transcript: recordCharge [new]
        Note over Transcript: Recorded where the charge is drawn. Read at export it would be the session total
    else "the provider call failed"
        Model-->>Runner: Outcome of failure
        Runner->>Runner: endTurnAsUnfinished
        Note over Runner: Nothing is appended, so the step slice stays empty and the document says why
    end
```

Arrows: uses-relationship (client to supplier).

## What The Diagram Does Not Show

The two recording sites sit either side of the tool calls, and that ordering is what makes the budget line correct.

TranscriptRepository.recordCall (Session Transcript) runs before the provider call, so a step the provider failed on still names what it was sent. TranscriptRepository.recordCharge (Session Transcript, new) runs after the calls have run, because ConversationTurnRunner.spendOn (Engine Turn) is the one place a batch's size reaches the counter and it is called once the batch is done.
