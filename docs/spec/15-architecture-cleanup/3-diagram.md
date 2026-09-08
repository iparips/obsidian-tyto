# Diagram: Sub-Package Dependencies

## How the sub-packages depend on each other

```mermaid
flowchart LR
    subgraph Root["Engine Root"]
        EditEngine["EditEngine [Engine]<br/>Responsibility: owns the agent loop by asking the model and spending the budget"]
        ToolDispatcher["ToolDispatcher [Engine]<br/>Responsibility: owns one tool call by routing it and publishing what it did"]
        EngineFactory["EngineFactory [Engine]<br/>Responsibility: owns the wiring by building what outlives a session"]
        Progress["TurnProgressPublisher [Engine]<br/>Responsibility: owns the panel channel by reporting each step"]
    end

    subgraph Turn["turn/"]
        TurnFactory["TurnFactory [Engine]<br/>Responsibility: owns the turn scope by building what dies with it"]
        TurnRepository["TurnRepository [Engine]<br/>Responsibility: owns one turn's state by holding what it opened and spent"]
    end

    subgraph Tools["tools/"]
        HarnessTools["HarnessTools [Engine]<br/>Responsibility: owns the model-facing surface by running the call it names"]
        SearchTools["SearchTools [Engine]<br/>Responsibility: owns vault lookup by globbing paths and grepping content"]
        ShortlistTool["ShortlistTool [Engine]<br/>Responsibility: owns the offer by filtering paths no search returned"]
        NoteEditTool["NoteEditTool [Engine]<br/>Responsibility: owns the write guard by refusing an edit to an unopened note"]
    end

    subgraph Waiting["waiting/"]
        NoteChoice["NoteChoice [Engine]<br/>Responsibility: owns the pick by parking the turn until the user chooses"]
        UserQuestion["UserQuestion [Engine]<br/>Responsibility: owns the answer by parking the turn until the user replies"]
        PendingAnswer["PendingAnswer [Engine]<br/>Responsibility: owns the parking by racing an answer against a cancellation"]
    end

    subgraph Editing["note-editing/"]
        NoteOperationParser["NoteOperationParser [Engine]<br/>Responsibility: owns the translation by turning a call into an operation"]
        NoteEditor["NoteEditor [Engine]<br/>Responsibility: owns the text change by applying one operation to an editor"]
    end

    subgraph Binding["note-binding/"]
        TargetNoteResolver["TargetNoteResolver [Engine]<br/>Responsibility: owns resolution by turning the session path into an editor"]
        WorkspaceNoteLocator["WorkspaceNoteLocator [Engine]<br/>Responsibility: owns the lookup by finding the leaf showing a path"]
    end

    subgraph Prompting["prompting/"]
        PromptFactory["PromptFactory [Engine]<br/>Responsibility: owns what the model reads by assembling the system prompt"]
        RuleBuilder["RuleBuilder [Engine]<br/>Responsibility: owns the standing rules by stating them as text"]
    end

    EngineFactory --> EditEngine
    EditEngine --> TurnFactory
    EditEngine --> PromptFactory
    EditEngine --> Progress
    TurnFactory --> TurnRepository
    TurnFactory --> ToolDispatcher
    TurnFactory --> TargetNoteResolver
    ToolDispatcher --> HarnessTools
    ToolDispatcher --> NoteEditTool
    ToolDispatcher --> NoteChoice
    ToolDispatcher --> UserQuestion
    ToolDispatcher --> TurnRepository
    ToolDispatcher --> Progress
    HarnessTools --> SearchTools
    HarnessTools --> ShortlistTool
    NoteChoice --> PendingAnswer
    UserQuestion --> PendingAnswer
    NoteEditTool --> NoteOperationParser
    NoteEditTool --> NoteEditor
    NoteEditTool --> TurnRepository
    TargetNoteResolver --> WorkspaceNoteLocator
    PromptFactory --> RuleBuilder

    classDef root fill:#4a5568,color:#fff
    class EditEngine,ToolDispatcher,EngineFactory,Progress root
```

Arrows: uses-relationship (client to supplier).

Grey marks the root files that span sub-packages by design.

## What the shape shows

ToolDispatcher (Engine) touches five of the six sub-packages. That is the
dispatcher's job, and it is why the file stays at the root rather than joining
any one group.

Three arrows cross between non-root sub-packages, and two of them start at
NoteEditTool (Engine): it drives note-editing/ to make the change, and reads
TurnRepository (Engine) for its guard. The third is TurnFactory (Engine)
building against note-binding/.

That NoteEditTool sits in tools/ and reaches into note-editing/ is the shape
the split is meant to show. The tool is the surface; the editor is what the
surface drives.

prompting/ has no inbound edge except from EditEngine (Engine). It is the most
separable group in the package.

## The waiting/ boundary

```mermaid
flowchart LR
    Model["Chat Provider [Providers]<br/>Responsibility: owns the model call by returning tool calls or text"]
    HarnessTools["HarnessTools [Engine]<br/>Responsibility: owns the tool run by producing a request value"]
    ToolDispatcher["ToolDispatcher [Engine]<br/>Responsibility: owns the branch by awaiting the person after the tool returned"]
    NoteChoice["NoteChoice [Engine]<br/>Responsibility: owns the pick by parking until the user chooses"]
    TurnAskers["TurnAskers [Session]<br/>Responsibility: owns the mode by choosing who answers"]
    Panel["SessionPanel [Session]<br/>Responsibility: owns the person by rendering the choice"]

    Model --> ToolDispatcher
    ToolDispatcher --> HarnessTools
    ToolDispatcher --> NoteChoice
    NoteChoice --> TurnAskers
    TurnAskers --> Panel
```

Arrows: uses-relationship (client to supplier).

choose_note is a tool, so HarnessTools (Engine) runs it. That run produces a
ChoiceRequest, not a pick. The pick comes from a person, and NoteChoice
(Engine) waits for one. The chain leaves the engine at TurnAskers (Session), so
the boundary already exists in the code.
