# Design: One Turn, Call by Call

The proposed shape from
[5-design-self-running-turn.md](5-design-self-running-turn.md), with the methods
each collaborator calls, what it passes, and the block each class belongs to.

```mermaid
sequenceDiagram
    participant Engine as EditEngine [Engine]
    participant Factory as TurnFactory [Engine Turn]
    participant Session as SessionRepository [Session]
    participant Turn as Turn [Engine Turn]
    participant Iteration as TurnIteration [Engine Turn, new]
    participant Caller as ModelCaller [Engine]
    participant Dispatcher as ToolDispatcher [Engine]
    participant TurnRepo as TurnRepository [Engine Turn]
    participant Conclusion as TurnConclusionService [Engine]

    Note over Engine,Conclusion: OPENING
    Engine->>Session: appendChatMessage(ChatMessage.user(text))
    Engine->>Factory: openTurn() [new]
    Factory->>Factory: targetNoteResolver.resolve()
    Factory-->>Engine: Attempt of Turn
    Engine->>Turn: run() [new]

    Note over Engine,Conclusion: ONE ITERATION
    Turn->>Turn: cancellationController.isCancelled()
    Turn->>Iteration: run(spend, iteration) [new]
    Iteration->>TurnRepo: targetNote(), skills(), agentMdChain()
    Iteration->>Session: chatHistory()
    Iteration->>Caller: ask(ModelRequest)
    Caller-->>Iteration: Outcome of ChatTurn

    Note over Iteration,Dispatcher: TOOL CALLS, ONE PASS PER CALL
    Iteration->>Session: appendChatMessage(ChatMessage.modelToolCalls(calls))
    Iteration->>Dispatcher: execute(call)
    Dispatcher-->>Iteration: ToolCallOutcome
    Iteration->>Session: appendChatMessage(ChatMessage.toolCallResult(call.id, result))
    Iteration->>TurnRepo: storeCursorPositionAndWrittenNote(editEndPosition)
    Iteration->>Iteration: repeatedRefusalCounter.record(refusal)
    Iteration-->>Turn: null while the turn keeps going

    Note over Engine,Conclusion: ENDING ON AN ANSWER
    Iteration->>TurnRepo: targetNote(), editEnd()
    Iteration->>Conclusion: utterance(summary, note, editEndPosition)
    Conclusion->>Session: appendChatMessage(ChatMessage.model(summary))
    Conclusion->>Conclusion: noteEditor.focusEdit(editor, position)
    Conclusion-->>Turn: Success of string

    Note over Engine,Conclusion: ENDING ON A CANCEL
    Turn->>TurnRepo: writtenNotes()
    Turn->>Conclusion: cancelled(writtenNotes)
    Conclusion->>Session: appendChatMessage(ChatMessage.model(cancelNote))
    Conclusion-->>Turn: Cancelled of string

    Note over Turn,Conclusion: The other three endings record nothing, so they build an outcome and return
    Turn->>Conclusion: exhausted()
    Turn-->>Engine: Outcome of string
```

Arrows: uses-relationship (client to supplier).

Two calls change owner rather than shape. The four appendChatMessage calls that
EditEngine makes today are made by TurnIteration and TurnConclusionService. The
fifth, the utterance, stays with EditEngine, recorded where the text arrives and
before openTurn runs: see
[5-design-self-running-turn.md](5-design-self-running-turn.md#moved-back-after-the-fact).

## What each class is

Blocks are the categories in [2-what-maps.md](2-what-maps.md) and
[3-what-does-not.md](3-what-does-not.md). The loop moves between classes; no
class changes what kind of thing it is.

| Class                 | Block        | Holds                                   |
| --------------------- | ------------ | --------------------------------------- |
| EditEngine            | Controller   | Collaborators, the running turn         |
| TurnFactory           | Service      | Collaborators, one session-scoped Set   |
| Turn                  | Service      | Collaborators only                      |
| TurnIteration         | Service, new | Collaborators only                      |
| TurnConclusionService | Service      | Collaborators only                      |
| ModelCaller           | Service      | Collaborators only                      |
| ToolDispatcher        | Service      | Collaborators only                      |
| SessionRepository     | Repository   | The target path and the chat history    |
| TurnRepository        | Repository   | What one turn opened, wrote and settled |
| TurnSpend             | Entity       | This turn's two counters                |
| ChatMessage           | Value object | One message, immutable                  |
| ModelRequest          | Value object | The five arguments of one model call    |
| Outcome               | Value object | A success, failure or cancellation      |

Turn stays a service, which is the point worth stating. It gains a loop but no
field it mutates: the spend it drives lives in TurnSpend, and the flag the
cancel flips lives in TurnCancellationController. A class holding only
collaborators is a service however much it does.

TurnIteration is the same shape. It is built per pass, so it holds the spend and
the turn it runs against, and mutates neither.
