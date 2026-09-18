---
created: 2026-09-18
updated: 2026-09-18
---

# Design Phase Context

The phase produced [../design-ending-on-an-answer/1-index.md](../design-ending-on-an-answer/1-index.md) and [../unit-tests/1-index.md](../unit-tests/1-index.md), and corrected [../4-acceptance-criteria.md](../4-acceptance-criteria.md) and [../1-index.md](../1-index.md). Conventions, the colour key and the impact scale are in [1-index.md](1-index.md).

Cost: 66,252 estimated read tokens. By category, code 36,412, skill 23,210, command 5,291, navigation 826, state 514. By impact, high 21,800, medium 18,400, low 13,100, no impact 12,900. Full accounting in [4-context-budget.md](4-context-budget.md).

## Discovery path

```mermaid
flowchart LR
    Prompt["The design prompt<br/>[high impact]"]
    SddSkill["skills/sdd/SKILL.md<br/>[high impact]"]
    DesignConv["skills/sdd/references/design-conventions.md<br/>[high impact]"]
    UnitFormat["skills/sdd/references/unit-tests-format.md<br/>[high impact]"]
    AcFormat["skills/sdd/references/acceptance-criteria-format.md<br/>[medium impact]"]
    DecFormat["skills/sdd/references/decisions-file-format.md<br/>[medium impact]"]
    CodeGen["skills/code-generation/SKILL.md<br/>[medium impact]"]
    CodeGenTs["skills/code-generation/references/typescript.md<br/>[high impact]"]
    UnitSkill["skills/code-unit-tests/SKILL.md<br/>[low impact]"]
    UnitTs["skills/code-unit-tests/references/typescript.md<br/>[low impact]"]
    TextGen["skills/text-generation/SKILL.md<br/>[high impact]"]
    Mermaid["skills/mermaid/SKILL.md<br/>[medium impact]"]

    SpecFiles["tyto/docs/spec 2026-09-18c four spec files<br/>[high impact]"]
    Overview["tyto/docs/architecture/1-overview.md<br/>[medium impact]"]
    TheTurn["tyto/docs/architecture/4-the-turn.md<br/>[medium impact]"]
    Vocab["tyto/docs/architecture/2-vocabulary.md<br/>[high impact]"]

    Outcome["tyto/src/engine/tool-call-outcome.ts<br/>[high impact]"]
    EndKind["tyto/src/engine/turn/ending/turn-ending-kind.ts<br/>[high impact]"]
    StepOutcome["tyto/src/engine/turn/ending/turn-step-outcome.ts<br/>[high impact]"]
    TurnOutcomes["tyto/src/engine/turn/ending/turn-outcomes.ts<br/>[medium impact]"]
    EndService["tyto/src/engine/turn-ending-service.ts<br/>[high impact]"]
    Runner["tyto/src/engine/turn/conversation-turn-runner.ts<br/>[high impact]"]
    Executor["tyto/src/engine/turn/tool-call-executor.ts<br/>[high impact]"]
    Dispatcher["tyto/src/engine/tool-dispatcher.ts<br/>[high impact]"]
    ModelAnswer["tyto/src/engine/tools/model-answer.ts<br/>[low impact]"]
    SharedOutcome["tyto/src/shared/models/outcome.ts<br/>[medium impact]"]
    ChatTurn["tyto/src/model/providers/models/chat-turn.ts<br/>[low impact]"]
    HarnessKind["tyto/src/engine/tools/harness-result-kind.ts<br/>[no impact]"]
    Engine["tyto/src/engine/edit-engine.ts<br/>[high impact]"]
    Queue["tyto/src/engine/utterance-queue.ts<br/>[medium impact]"]
    Panel["tyto/src/session/views/SessionPanel.tsx<br/>[high impact]"]
    Action["tyto/src/session/models/panel-action.ts<br/>[high impact]"]
    Reducer["tyto/src/session/models/panel-reducer.ts<br/>[high impact]"]
    Asked["tyto/src/session/models/asked-entries.ts<br/>[high impact]"]
    History["tyto/src/session/views/hooks/useRecordedHistory.ts<br/>[low impact]"]
    TransRepo["tyto/src/session/transcript/transcript-repository.ts<br/>[medium impact]"]
    TransSection["tyto/src/session/transcript/transcript-turn-section.ts<br/>[high impact]"]
    TransStep["tyto/src/session/transcript/transcript-turn-step.ts<br/>[high impact]"]
    Wiring["tyto/src/wiring/session-panel-props-builder.ts<br/>[medium impact]"]

    Builders["tyto/src/test-support/builders.ts<br/>[medium impact]"]
    RunnerTest["tyto/src/engine/tests/conversation-turn-runner-endings.test.ts<br/>[high impact]"]
    HarnessTest["tyto/src/engine/tests/edit-engine-harness.test.ts<br/>[high impact]"]
    PanelTest["tyto/src/session/views/tests/SessionPanel.test.tsx<br/>[medium impact]"]
    TransTest["tyto/src/session/transcript/tests/transcript-repository.test.ts<br/>[medium impact]"]

    GrepKind["grep TurnEndingKind across src<br/>[high impact]"]
    GrepNotify["grep notifySucceeded across src<br/>[high impact]"]
    FindListing["grep answers-from-a-listing block<br/>[medium impact]"]

    Suite["bun run test, 1504 passing<br/>[medium impact]"]
    Git["git status, src untouched<br/>[medium impact]"]

    Waiting["tyto/src/engine/waiting<br/>[not read]"]
    Spending["tyto/src/engine/turn/spending<br/>[not read]"]
    Prompt5["tyto/docs/architecture/5-asking-the-model.md<br/>[not read]"]
    Panel7["tyto/docs/architecture/7-the-panel.md<br/>[not read]"]

    Design["The design and its test plan<br/>[artefact]"]

    Prompt --> SddSkill
    Prompt --> SpecFiles
    Prompt --> Overview
    Prompt --> Vocab
    Prompt --> TheTurn
    Prompt --> Dispatcher
    Prompt --> Outcome
    Prompt --> EndKind
    Prompt --> StepOutcome
    Prompt --> Runner
    Prompt --> Executor
    Prompt --> Panel
    Prompt --> RunnerTest
    Prompt --> HarnessTest
    Prompt --> TransTest
    Prompt --> PanelTest

    SddSkill -->|workflow step| DesignConv
    SddSkill -->|workflow step| DecFormat
    SddSkill -->|workflow step| AcFormat
    SddSkill -->|workflow step| CodeGen
    DesignConv -->|format ref| UnitFormat
    CodeGen -->|language ref| CodeGenTs
    Prompt --> UnitSkill
    UnitSkill -->|language ref| UnitTs
    Prompt --> TextGen
    Prompt --> Mermaid

    SpecFiles -->|references| Vocab
    SpecFiles -->|references| TheTurn
    Overview -->|package table| TheTurn
    EndKind -->|enum consumers| GrepKind
    GrepKind -->|hit| TransSection
    GrepKind -->|hit| TransRepo
    GrepKind -->|hit| TurnOutcomes
    TransSection -->|renders the kind| TransStep
    EndService -->|Outcomes calls| SharedOutcome
    StepOutcome -->|EndedTurn| EndService
    Runner -->|caller| Engine
    Engine -->|queue field| Queue
    Panel -->|dispatch| Action
    Action -->|switch| Reducer
    Reducer -->|turnEnded| Asked
    Reducer -->|dispatch record| History
    Panel -->|notifySucceeded| GrepNotify
    GrepNotify -->|hit| Wiring
    Dispatcher -->|ModelAnswer.from| ModelAnswer
    Dispatcher -->|isText branch| ChatTurn
    Dispatcher -->|result kinds| HarnessKind
    HarnessTest -->|helpers| Builders
    HarnessTest -->|describe block| FindListing
    Overview -.->|folder table| Waiting
    TheTurn -.->|folder table| Spending
    TheTurn -.->|references| Prompt5
    TheTurn -.->|references| Panel7

    Executor --> Design
    Runner --> Design
    EndService --> Design
    Panel --> Design
    TransSection --> Design
    Vocab --> Design
    Design --> Suite
    Design --> Git

    subgraph LEGEND["Legend"]
        L1["prompt"]
        L2["skill"]
        L3["reference document"]
        L4["code"]
        L5["system of record"]
        L6["navigation"]
        L7["never opened"]
        L8["artefact"]
    end

    classDef prompt fill:#4a6fa5,color:#fff
    classDef skill fill:#6b8f3a,color:#fff
    classDef refdoc fill:#8a5fa8,color:#fff
    classDef code fill:#3a7f8f,color:#fff
    classDef record fill:#a8763a,color:#fff
    classDef nav fill:#7a7a7a,color:#fff
    classDef unread stroke-dasharray: 5 5,fill:#e8e8e8,color:#333
    classDef artefact fill:#a83a4a,color:#fff

    class Prompt,L1 prompt
    class SddSkill,DesignConv,UnitFormat,AcFormat,DecFormat,CodeGen,CodeGenTs,UnitSkill,UnitTs,TextGen,Mermaid,L2 skill
    class Overview,TheTurn,Vocab,L3 refdoc
    class Outcome,EndKind,StepOutcome,TurnOutcomes,EndService,Runner,Executor,Dispatcher,ModelAnswer,SharedOutcome,ChatTurn,HarnessKind,Engine,Queue,Panel,Action,Reducer,Asked,History,TransRepo,TransSection,TransStep,Wiring,Builders,RunnerTest,HarnessTest,PanelTest,TransTest,L4 code
    class SpecFiles,Suite,Git,L5 record
    class GrepKind,GrepNotify,FindListing,L6 nav
    class Waiting,Spending,Prompt5,Panel7,L7 unread
    class Design,L8 artefact
```

Arrows: discovery path, source pointed me at the target.

## Per source

| Source                                   | Impact   | What it decided                                                                                     |
| ---------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| The design prompt                        | high     | Named all three hard calls and every code claim to verify; nothing had to be found                  |
| sdd/SKILL.md                             | high     | The artefact set, the numbering, and that the design fills the decisions file's Design section      |
| sdd design-conventions.md                | high     | The section order, and what a New interfaces block may and may not hold                             |
| sdd unit-tests-format.md                 | high     | Pseudocode then outline, per production method, and the 120-line break-out rule                     |
| sdd acceptance-criteria-format.md        | medium   | That a criterion the test plan now covers comes out, which removed the seventh                      |
| sdd decisions-file-format.md             | medium   | The D5 heading shape and its resolved-date marker                                                   |
| code-generation/SKILL.md                 | medium   | The append-to-the-end rule for the new constructor field, and the naming tests                      |
| code-generation typescript.md            | high     | That the sixth field is appended before no defaulted parameter, and that an enum stays an enum here |
| code-unit-tests/SKILL.md                 | low      | One test per branch, which the outline already followed                                             |
| code-unit-tests typescript.md            | low      | Vitest describe nesting, already visible in the four target test files                              |
| text-generation/SKILL.md                 | high     | Forced the split of both new files, and cut a conversational note from the criteria                 |
| mermaid/SKILL.md                         | medium   | No theme, no rect, bracketed suffixes, and the new marker inside the brackets                       |
| The four spec files                      | high     | Every decision the design implements, and the three code claims it had to check                     |
| architecture/1-overview.md               | medium   | That no new package is needed and that the wiring rule is untouched                                 |
| architecture/4-the-turn.md               | medium   | The How A Turn Ends table, which the returned pair falsifies                                        |
| architecture/2-vocabulary.md             | high     | Both claims the design corrects: the five-ending table and the never-reaches-history line           |
| tool-call-outcome.ts                     | high     | The five existing fields, and that the factories pair fields the call sites must not                |
| turn-ending-kind.ts                      | high     | The five values and their comment shape, which Answered follows                                     |
| turn-step-outcome.ts                     | high     | That EndedTurn already holds the pair, so TurnResult copies a shape rather than inventing one       |
| turn-outcomes.ts                         | medium   | The split the new method must not land on: it writes to history, so it is not here                  |
| turn-ending-service.ts                   | high     | Where endTurnWithAnswer sits, and that it must not focus an edit                                    |
| conversation-turn-runner.ts              | high     | That the stuck check runs before the spend, which fixes where the answer is read                    |
| tool-call-executor.ts                    | high     | That the loop returns void today, so the accumulate-then-return shape is the change                 |
| tool-dispatcher.ts                       | high     | Confirmed :202 and :231, and that publishModelAnswer changes one line                               |
| tools/model-answer.ts                    | low      | That the sources are a separate field, so appending the text alone is one argument                  |
| shared/models/outcome.ts                 | medium   | That Outcome narrows through a this-is predicate, so a fourth variant would touch every caller      |
| chat-turn.ts                             | low      | The private-kind-plus-factories precedent TurnResult follows                                        |
| harness-result-kind.ts                   | no       | Checked as a naming precedent; the enum comment shape came from turn-ending-kind                    |
| edit-engine.ts                           | high     | The failure branch in runTurn that also needs wrapping in TurnResult                                |
| utterance-queue.ts                       | medium   | That the queue is generic over the promise, so the type moves with one signature                    |
| SessionPanel.tsx                         | high     | The three branches, and that the new one goes first because answered is a success                   |
| panel-action.ts                          | high     | That turnAnswered is a new action rather than a reuse of summary                                    |
| panel-reducer.ts                         | high     | That the answer case leaves the phase alone, so the ending must move it                             |
| asked-entries.ts                         | high     | turnEnded as the settling mechanism turnAnswered has to call                                        |
| useRecordedHistory.ts                    | low      | That the record follows every dispatch, so the new action is recorded like the rest                 |
| transcript-repository.ts                 | medium   | That recordEnding takes any kind, so it needs no change beyond a test                               |
| transcript-turn-section.ts               | high     | The finding the spec missed: the Replied branch at :100 assumes five endings                        |
| transcript-turn-step.ts                  | high     | That the ending renders as the raw enum value, which removed the seventh criterion                  |
| session-panel-props-builder.ts           | medium   | Confirmed the one production caller of processUtterance, closing a requirements assumption          |
| test-support/builders.ts                 | medium   | anEngine and aToolTurn as the helpers the plan names                                                |
| conversation-turn-runner-endings.test.ts | high     | The endings() helper the new leaves assert through                                                  |
| edit-engine-harness.test.ts              | high     | That respondsWith falls through to a text turn, correcting the prompt's claim                       |
| SessionPanel.test.tsx                    | medium   | That the processUtterance mock is what moves with the type                                          |
| transcript-repository.test.ts            | medium   | The when-a-turn-ends block the new leaf joins                                                       |
| grep TurnEndingKind across src           | high     | Found transcript-turn-section.ts, the site no spec file names                                       |
| grep notifySucceeded across src          | high     | Found the wiring caller, closing the assumption about a second consumer                             |
| grep the answers-from-a-listing block    | medium   | The two existing tests, and that neither asserts the continue behaviour                             |
| bun run test                             | medium   | 1504 passing with src untouched, which is what the prompt asked be checked                          |
| git status                               | medium   | Proved no production file moved this session                                                        |
| src/engine/waiting                       | not read | Named in the folder table; out of scope per the requirements                                        |
| src/engine/turn/spending                 | not read | The spend is unchanged, so the counters needed no reading                                           |
| architecture/5-asking-the-model.md       | not read | What one model call holds; the change touches no prompt assembly                                    |
| architecture/7-the-panel.md              | not read | Pointed at by 4-the-turn; the panel files themselves were read instead                              |

## Shape notes

- The prompt is the hub, not a document. Sixteen sources hang directly off it, including every code claim it asked be verified. A phase whose prompt names its own reading list has a flat graph, and the deep chains here are the ones the prompt did not anticipate.
- One chain paid for itself: turn-ending-kind to the grep to transcript-turn-section to transcript-turn-step. Four hops, and it is where the finding the spec missed came from. Nothing in the spec folder points at either file.
- The other deep chain is the panel's: SessionPanel to panel-action to panel-reducer to asked-entries. Four hops, and it is what turned "the panel branches on the kind" into a named new action that has to settle the turn.
- Two greps did the work a reference could not. Both were consumer sweeps rather than lookups, and both closed an assumption the requirements had left open.
- Four sources were pointed at and left unopened, all four correctly. Three are out of scope by the requirements, and the fourth was superseded by reading the panel code directly.
