# Design: One Turn, Call by Call

The proposed shape from
[5-design-self-running-turn.md](5-design-self-running-turn.md), with the methods
each collaborator calls, what it passes, and the block each class belongs to.

```mermaid
sequenceDiagram
    participant Engine as EditEngine [Engine]
    participant Factory as TurnRunnerFactory [Engine Turn]
    participant Session as SessionRepository [Session]
    participant Turn as ConversationTurnRunner [Engine Turn]
    participant StepService as TurnStepService [Engine Turn, new]
    participant Caller as ModelCaller [Engine]
    participant Dispatcher as ToolDispatcher [Engine]
    participant TurnRepo as TurnRepository [Engine Turn]
    participant Conclusion as TurnConclusionService [Engine]

    Note over Engine,Conclusion: OPENING
    Engine->>Session: appendChatMessage(ChatMessage.user(text))
    Engine->>Factory: buildRunnerForCurrentTurn() [new]
    Factory->>Factory: targetNoteResolver.resolve()
    Factory-->>Engine: Attempt of ConversationTurnRunner
    Engine->>Turn: run() [new]

    Note over Engine,Conclusion: ONE STEP
    Turn->>Turn: cancellationController.isCancelled()
    Turn->>StepService: askModel(step) [new]
    StepService->>TurnRepo: targetNote(), skills(), agentMdChain()
    StepService->>Session: chatHistory()
    StepService->>Caller: ask(ModelRequest)
    Caller-->>StepService: Outcome of ChatTurn
    StepService-->>Turn: Outcome of ChatTurn, logged as one step

    Note over Turn,Dispatcher: TOOL CALLS, ONE PASS PER CALL
    Turn->>StepService: executeToolCalls(calls, repeatedRefusalCounter)
    StepService->>Session: appendChatMessage(ChatMessage.modelToolCalls(calls))
    StepService->>Dispatcher: execute(call)
    Dispatcher-->>StepService: ToolCallOutcome
    StepService->>Session: appendChatMessage(ChatMessage.toolCallResult(call.id, result))
    StepService->>TurnRepo: storeCursorPositionAndWrittenNote(editEndPosition)
    StepService->>StepService: repeatedRefusalCounter.record(refusal)
    Note over Turn: TurnStepResults.keepGoing when the turn has more to do

    Note over Engine,Conclusion: ENDING ON AN ANSWER
    Turn->>TurnRepo: targetNote(), editEnd()
    Turn->>Conclusion: utterance(summary, note, editEndPosition)
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
EditEngine makes today are made by TurnStepService and TurnConclusionService. The
fifth, the utterance, stays with EditEngine, recorded where the text arrives and
before the runner is built: see
[5-design-self-running-turn.md](5-design-self-running-turn.md#moved-back-after-the-fact).

## What each class is

Blocks are the categories in [2-what-maps.md](2-what-maps.md) and
[3-what-does-not.md](3-what-does-not.md). The loop moves between classes; no
class changes what kind of thing it is.

| Class                  | Block        | Holds                                   |
| ---------------------- | ------------ | --------------------------------------- |
| EditEngine             | Controller   | Collaborators, the running turn         |
| TurnRunnerFactory      | Service      | Collaborators, one session-scoped Set   |
| ConversationTurnRunner | Service      | Collaborators only                      |
| TurnStepService        | Service, new | Collaborators only                      |
| TurnConclusionService  | Service      | Collaborators only                      |
| ModelCaller            | Service      | Collaborators only                      |
| ToolDispatcher         | Service      | Collaborators only                      |
| SessionRepository      | Repository   | The target path and the chat history    |
| TurnRepository         | Repository   | What one turn opened, wrote and settled |
| TurnSpend              | Entity       | This turn's two counters                |
| ChatMessage            | Value object | One message, immutable                  |
| ModelRequest           | Value object | The five arguments of one model call    |
| Outcome                | Value object | A success, failure or cancellation      |

ConversationTurnRunner stays a service, which is the point worth stating. It
gains a loop but no field it mutates: the spend it drives lives in TurnSpend,
and the flag the cancel flips lives in TurnCancellationController. A class
holding only collaborators is a service however much it does.

TurnStepService is the same shape. It is built once per turn, holds only
collaborators, and takes the step number and the refusal counter as parameters
rather than fields.
