# Before and After

## As is

```mermaid
flowchart LR
    EditEngine["EditEngine [Engine]<br/>Responsibility: owns the turn by queueing utterances, looping the model, and ending it five ways"]
    TurnFactory["TurnFactory [Engine]<br/>Responsibility: opens a turn by resolving the note and reading the skills"]
    PromptFactory["PromptFactory [Engine]<br/>Responsibility: assembles the four messages the model reads"]
    ChatProvider["ChatProvider [Providers]<br/>Responsibility: calls the model and returns tool calls or text"]
    ToolDispatcher["ToolDispatcher [Engine]<br/>Responsibility: runs one tool call and acts on what it returns"]
    SessionRepository["SessionRepository [Session]<br/>Responsibility: holds the chat history and the target note"]
    NoteEditor["NoteEditor [Engine]<br/>Responsibility: applies an operation, and focuses the last edit"]
    Publisher["TurnProgressPublisher [Engine]<br/>Responsibility: reports progress to the panel"]
    HarnessToolsService["HarnessToolsService [Engine]<br/>Responsibility: names what the vault allows, for the prompt and the schemas"]

    EditEngine --> TurnFactory
    EditEngine --> PromptFactory
    EditEngine --> ChatProvider
    EditEngine --> ToolDispatcher
    EditEngine --> SessionRepository
    EditEngine --> NoteEditor
    EditEngine --> Publisher
    EditEngine --> HarnessToolsService

    classDef wide fill:#4a5568,color:#fff
    class EditEngine wide
```

Arrows: uses-relationship (client to supplier). Grey marks the class carrying
more than one responsibility.

## To be, after all three

```mermaid
flowchart LR
    UtteranceQueue["UtteranceQueue [Engine, new]<br/>Responsibility: runs one utterance at a time, without a failure poisoning the chain"]
    EditEngine["EditEngine [Engine]<br/>Responsibility: owns the agent loop by spending the budget and deciding when the turn ends"]
    ModelCaller["ModelCaller [Engine, new]<br/>Responsibility: turns a turn into a model call, prompt and schemas included"]
    TurnConclusionService["TurnConclusionService [Engine, new]<br/>Responsibility: ends a turn five ways, each writing what happened to history"]
    TurnFactory["TurnFactory [Engine]<br/>Responsibility: opens a turn by resolving the note and reading the skills"]
    SessionRepository["SessionRepository [Session]<br/>Responsibility: holds the chat history and the target note"]
    PromptFactory["PromptFactory [Engine]<br/>Responsibility: assembles the four messages the model reads"]
    ChatProvider["ChatProvider [Providers]<br/>Responsibility: calls the model and returns tool calls or text"]
    HarnessToolsService["HarnessToolsService [Engine]<br/>Responsibility: names what the vault allows, for the prompt and the schemas"]
    NoteEditor["NoteEditor [Engine]<br/>Responsibility: applies an operation, and focuses the last edit"]
    ToolDispatcher["ToolDispatcher [Engine]<br/>Responsibility: runs one tool call and acts on what it returns"]

    UtteranceQueue --> EditEngine
    EditEngine --> TurnFactory
    EditEngine --> ModelCaller
    EditEngine --> TurnConclusionService
    EditEngine --> SessionRepository
    EditEngine --> ToolDispatcher
    ModelCaller --> PromptFactory
    ModelCaller --> ChatProvider
    ModelCaller --> HarnessToolsService
    TurnConclusionService --> SessionRepository
    TurnConclusionService --> NoteEditor

    classDef added fill:#4a5568,color:#fff
    class UtteranceQueue,ModelCaller,TurnConclusionService added
```

Arrows: uses-relationship (client to supplier). Grey marks what the three
extractions add.

EditEngine holds four, and nothing it gains holds more than two. ToolDispatcher
comes off the turn rather than the constructor, so it is drawn but not counted.

The queue sits above rather than beside: it decides when a turn runs, so the
plugin calls it and it calls the engine.

Two collaborators leave EditEngine entirely. NoteEditor is used once, to focus
the last edit when a turn succeeds, which is TurnConclusionService's job after the
move. ChatProvider and HarnessToolsService go to ModelCaller, which is the only place
either is used for prompting.

SessionRepository stays in both, which is the one shared dependency: the
conclusions append to history, and the loop still appends the utterance and each
tool result.
