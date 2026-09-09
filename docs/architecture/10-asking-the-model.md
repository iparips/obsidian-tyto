# Asking the Model

The object graph behind ModelService.askModel (Engine Turn), which is one of the
two outward calls a turn step makes. The other is ToolCallExecutor (Engine
Turn), covered by [8-parking-a-turn.md](8-parking-a-turn.md).

The loop decides when to ask, ModelService gathers what the ask needs, and
ModelRequestMapper (Model) turns that into the messages sent. It is static, the
request being all it needs.

## Who holds whom

TurnRunnerFactory (Engine Turn) builds the graph. It holds what outlives a turn
and constructs what does not, so the turn-scoped boundary is one class.

| Collaborator               | Scope   | Supplies to the ask                    |
| -------------------------- | ------- | -------------------------------------- |
| SessionRepository          | Session | The chat history, across turns         |
| TurnRepository             | Turn    | Target note, skills, AGENTS.md chain   |
| TurnCancellationController | Turn    | The abort signal the provider takes    |
| HarnessToolsService        | Session | Tool schemas, allowed commands, search |
| ChatProvider               | Session | The completion itself                  |

Only the history and the harness reach are session-scoped. An editor handle
cannot outlive its turn, so the note reaches the request through TurnRepository.

## One ask, end to end

```mermaid
sequenceDiagram
    participant Runner as ConversationTurnRunner [Engine Turn]
    participant Model as ModelService [Engine Turn]
    participant TurnRepo as TurnRepository [Engine Turn]
    participant Session as SessionRepository [Session]
    participant Cancel as TurnCancellationController [Engine Turn]
    participant Mapper as ModelRequestMapper [Model]
    participant Prompts as PromptFactory [Model]
    participant Harness as HarnessToolsService [Engine Tools]
    participant Provider as ChatProvider [Model Providers]

    Runner->>Model: askModel(step)

    Note over Model,Harness: GATHER THE INPUTS INTO ONE VALUE
    Model->>TurnRepo: targetNote
    Model->>TurnRepo: skills
    Model->>TurnRepo: agentMdChain
    Model->>Session: chatHistory
    Model->>Harness: allowedCommands
    Model->>Harness: hasSearchEnabled
    Note over Model: They travel as one ModelRequest, not as six arguments

    Note over Model,Provider: BUILD THE MESSAGES
    Model->>Mapper: toMessages(ModelRequest)
    Mapper->>Prompts: standingRules(vaultDefinesSkills, chain, commands, search)
    Prompts-->>Mapper: ChatMessage
    Mapper->>Prompts: date(Today.of)
    Note over Mapper,Prompts: Today is read per call, so a turn past midnight resolves to the day it is on
    Prompts-->>Mapper: ChatMessage
    Mapper->>Prompts: skillCatalogue(skills)
    Prompts-->>Mapper: ChatMessage or null
    Mapper->>Prompts: noteContext or unboundContext
    Prompts-->>Mapper: ChatMessage
    Mapper-->>Model: ChatMessage list

    Note over Model,Provider: CALL OUT
    Model->>Harness: getToolCallSchemas(definesSkills)
    Note over Model,Harness: Fixed for the turn, so no tool drops out part way through
    Model->>Cancel: signal
    Model->>Provider: complete(messages, schemas, signal)
    Provider-->>Model: Outcome of ChatTurn

    Note over Model,TurnRepo: LOG WHAT THE STEP COST
    Model->>TurnRepo: targetNote
    Note over Model: Logged only on success, around the call rather than after it
    Model-->>Runner: Outcome of ChatTurn
```

Arrows: uses-relationship (client to supplier).

## Message order

The mapper orders messages by how stale a copy the history could hold: standing
rules first, then the conversation, then the date, the skill catalogue and the
final context. The last three sit after the history so the model cannot read any
of them off an earlier turn.

The final context has two shapes: a bound session gets the note's details, an
unbound one gets what it may still reach.

## Where skills enter

| What               | Built by                 | Carries              |
| ------------------ | ------------------------ | -------------------- |
| How a skill works  | standingRules            | Rules only, no names |
| Which skills exist | skillCatalogue           | Name and description |
| A skill's steps    | ToolDispatcher.loadSkill | The full body        |

The catalogue is its own message rather than a paragraph appended to the date,
so the names the model matches an utterance against are not read as a footnote
to something else. It is null for a vault defining none, which the mapper drops.

The body never passes through message assembly. It arrives as a load_skill tool
result, which ToolCallExecutor appends to the history, so the next iteration
reads it as conversation. The harness never picks the skill: TurnRepository
only holds the model to answering before it writes.

## What ModelService does not do

It returns the outcome untouched, appending nothing to the history and ending no
turn. A text answer is ended by TurnEndingService (Engine), a failed ask by
ConversationTurnRunner (Engine Turn).

Its one side effect is the debug line, the only record of why a turn spent its
iterations: the panel shows commands and answers, not the edits retried.
