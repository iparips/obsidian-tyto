---
created: 2026-09-18
updated: 2026-09-18
---

# Design Phase Context

The phase produced the six design files under design-searching-for-a-misheard-name, the test plan in 6-unit-tests.md, five design decisions appended to 3-decisions.md, and one rewritten acceptance criterion. Conventions are in [1-index.md](1-index.md).

## Cost

About 74,400 tokens of tool results across 73 reads. By category: code 43,164, skills 22,681, commands 5,309, navigation 3,285. By impact: high 31,200, medium 26,800, low 11,100, none 5,300. The accounting is [4-context-budget.md](4-context-budget.md).

## Discovery path

```mermaid
flowchart LR
    Prompt["User prompt<br/>the design brief [high impact]"]

    SddSkill["skills/sdd/SKILL.md [high impact]"]
    DesignConv["sdd/references/design-conventions.md [high impact]"]
    UnitFmt["sdd/references/unit-tests-format.md [high impact]"]
    AcceptFmt["sdd/references/acceptance-criteria-format.md [medium impact]"]
    CodeGen["skills/code-generation/SKILL.md [high impact]"]
    TypeScript["code-generation/references/typescript.md [medium impact]"]
    UnitSkill["skills/code-unit-tests/SKILL.md [medium impact]"]
    TextGen["skills/text-generation/SKILL.md [high impact]"]
    Mermaid["skills/mermaid/SKILL.md [medium impact]"]

    SpecIndex["spec/1-index.md [medium impact]"]
    Reqs["spec/2-requirements.md [high impact]"]
    Decisions["spec/3-decisions.md [high impact]"]
    Accept["spec/4-acceptance-criteria.md [high impact]"]

    Overview["docs/architecture/1-overview.md [high impact]"]
    Vocab["docs/architecture/2-vocabulary.md [low impact]"]
    Turn["docs/architecture/4-the-turn.md [medium impact]"]
    Asking["docs/architecture/5-asking-the-model.md [low impact]"]
    Reaching["docs/architecture/6-reaching-a-note.md [not read]"]

    Sibling["spec/2026-09-18-suggesting-tags/5-design [high impact]"]
    SiblingTests["spec/2026-09-18-suggesting-tags/6-unit-tests.md [medium impact]"]

    NoteGrep["obsidian-tyto src/search/note-grep.ts [high impact]"]
    NoteExcerpt["obsidian-tyto src/search/note-excerpt.ts [high impact]"]
    SearchHit["obsidian-tyto src/search/models/search-hit.ts [high impact]"]
    GrepResult["obsidian-tyto src/search/models/grep-result.ts [medium impact]"]
    GrepRequest["obsidian-tyto src/search/models/grep-request.ts [high impact]"]
    SearchReport["obsidian-tyto src/search/search-report.ts [high impact]"]
    Schemas["obsidian-tyto src/engine/tools/tool-schemas.ts [high impact]"]

    Runner["obsidian-tyto src/engine/turn/conversation-turn-runner.ts [high impact]"]
    EndKind["obsidian-tyto src/engine/turn/ending/turn-ending-kind.ts [high impact]"]
    Outcomes["obsidian-tyto src/engine/turn/ending/turn-outcomes.ts [high impact]"]
    StepOutcome["obsidian-tyto src/engine/turn/ending/turn-step-outcome.ts [medium impact]"]
    EndingSvc["obsidian-tyto src/engine/turn-ending-service.ts [high impact]"]
    Refusals["obsidian-tyto src/engine/turn/spending/repeated-refusal-counter.ts [high impact]"]
    Spend["obsidian-tyto src/engine/turn/spending/turn-spend.ts [medium impact]"]
    Executor["obsidian-tyto src/engine/turn/tool-call-executor.ts [high impact]"]
    HarnessRes["obsidian-tyto src/engine/tools/harness-results.ts [high impact]"]
    CallOutcome["obsidian-tyto src/engine/tool-call-outcome.ts [high impact]"]
    SearchTools["obsidian-tyto src/engine/tools/search-tools-service.ts [high impact]"]
    Dispatcher["obsidian-tyto src/engine/tool-dispatcher.ts [medium impact]"]
    TurnRepo["obsidian-tyto src/engine/turn/turn-repository.ts [high impact]"]
    PathsRepo["obsidian-tyto src/engine/turn/paths-returned-by-vault-repository.ts [high impact]"]
    NotesRead["obsidian-tyto src/engine/turn/notes-read-repository.ts [high impact]"]
    Publisher["obsidian-tyto src/engine/turn-progress-publisher.ts [high impact]"]
    ProgressLine["obsidian-tyto src/engine/progress-line.ts [low impact]"]
    ModelSvc["obsidian-tyto src/engine/turn/model-service.ts [medium impact]"]
    Outcome["obsidian-tyto src/shared/models/outcome.ts [medium impact]"]

    Provider["obsidian-tyto src/model/providers/mistral-provider.ts [high impact]"]
    SearchSec["obsidian-tyto src/model/prompt/system-prompt-sections/search-section.ts [high impact]"]
    DictSec["obsidian-tyto src/model/prompt/system-prompt-sections/dictation-section.ts [high impact]"]
    RoleSec["obsidian-tyto src/model/prompt/system-prompt-sections/models-role.ts [medium impact]"]
    Fixture["obsidian-tyto tests/fixtures/release-3-prompt.txt [high impact]"]
    PromptTest["obsidian-tyto tests/system-prompt.test.ts [medium impact]"]

    GrepTest["obsidian-tyto src/search/tests/note-grep.test.ts [medium impact]"]
    ReportTest["obsidian-tyto src/search/tests/search-report.test.ts [high impact]"]
    EndingTest["obsidian-tyto src/engine/tests/conversation-turn-runner-endings.test.ts [medium impact]"]
    GrepHarnessTest["obsidian-tyto src/engine/tests/harness-tools-grep.test.ts [low impact]"]
    FakeVault["obsidian-tyto src/test-support/fake-vault.ts [medium impact]"]

    NavSpec["ls of the spec folder [low impact]"]
    NavRepos["find of the four repositories [medium impact]"]
    NavTests["ls of test-support and the test folders [medium impact]"]
    GrepAnswer["grep for answer_from_search [high impact]"]

    Artefact["design folder, 6-unit-tests.md, D5 to D9"]

    Prompt --> SddSkill
    Prompt --> CodeGen
    Prompt --> UnitSkill
    Prompt --> TextGen
    Prompt --> Mermaid
    Prompt --> NavSpec
    Prompt -->|named as claims to verify| NoteGrep
    Prompt -->|named as claims to verify| Provider
    Prompt -->|named as claims to verify| Fixture
    Prompt -->|named as the sibling| Sibling
    Prompt -->|named as architecture to read| Overview

    SddSkill --> DesignConv
    SddSkill --> UnitFmt
    SddSkill --> AcceptFmt
    CodeGen --> TypeScript

    NavSpec --> SpecIndex
    SpecIndex --> Reqs
    Reqs --> Decisions
    Reqs --> Accept
    Reqs -->|references section| NoteExcerpt
    Reqs -->|references section| SearchHit
    Reqs -->|references section| SearchReport
    Reqs -->|references section| Refusals
    Reqs -->|references section| EndKind
    Reqs -->|references section| SearchSec
    Reqs -->|references section| DictSec
    Reqs -->|references section| RoleSec
    Reqs -->|references section| Schemas
    Reqs -->|references section| Runner
    Reqs -->|references section| Turn
    Reqs -->|references section| Asking

    Overview --> Vocab
    Overview -.->|package table| Reaching

    Sibling --> SiblingTests

    NoteGrep -->|imports| GrepResult
    NoteGrep -->|imports| GrepRequest
    NoteGrep -->|imports| NoteExcerpt
    NoteGrep -->|imports| SearchHit
    SearchReport --> SearchTools
    SearchTools -->|returns| HarnessRes
    HarnessRes --> CallOutcome
    Runner -->|calls| Executor
    Runner -->|calls| EndingSvc
    Runner -->|calls| ModelSvc
    Runner -->|imports| Outcomes
    Outcomes --> StepOutcome
    Refusals --> Spend
    EndKind --> Outcomes
    EndingSvc -->|imports| Outcome
    Executor -->|records against| CallOutcome
    NavRepos --> TurnRepo
    TurnRepo -->|constructs| PathsRepo
    TurnRepo -->|constructs| NotesRead
    Runner -->|publishes through| Publisher
    Publisher --> ProgressLine
    GrepAnswer --> Dispatcher
    Dispatcher -->|publishes through| Publisher
    Fixture --> PromptTest
    NavTests --> GrepTest
    NavTests --> ReportTest
    NavTests --> EndingTest
    NavTests --> GrepHarnessTest
    NavTests --> FakeVault

    DesignConv --> Artefact
    UnitFmt --> Artefact
    NoteGrep --> Artefact
    SearchReport --> Artefact
    GrepRequest --> Artefact
    Schemas --> Artefact
    EndingSvc --> Artefact
    PathsRepo --> Artefact
    NotesRead --> Artefact
    Publisher --> Artefact
    Provider --> Artefact
    SearchSec --> Artefact
    DictSec --> Artefact
    Fixture --> Artefact
    ReportTest --> Artefact
    Sibling --> Artefact
    Decisions --> Artefact
    Accept --> Artefact

    classDef prompt fill:#5b8def,stroke:#2d4f9e,color:#fff
    classDef skill fill:#b07cc6,stroke:#6c4278,color:#fff
    classDef refdoc fill:#4fa3a5,stroke:#2b6264,color:#fff
    classDef code fill:#d98a3c,stroke:#8a5220,color:#fff
    classDef sysrec fill:#c0563f,stroke:#7a3225,color:#fff
    classDef nav fill:#8a8f98,stroke:#4c5058,color:#fff
    classDef unread fill:#e8e8e8,stroke:#999,color:#333,stroke-dasharray: 5 3
    classDef artefact fill:#4b8f4b,stroke:#2b562b,color:#fff

    class Prompt prompt
    class SddSkill,DesignConv,UnitFmt,AcceptFmt,CodeGen,TypeScript,UnitSkill,TextGen,Mermaid skill
    class SpecIndex,Reqs,Decisions,Accept,Overview,Vocab,Turn,Asking refdoc
    class NoteGrep,NoteExcerpt,SearchHit,GrepResult,GrepRequest,SearchReport,Schemas,Runner,EndKind,Outcomes,StepOutcome,EndingSvc,Refusals,Spend,Executor,HarnessRes,CallOutcome,SearchTools,Dispatcher,TurnRepo,PathsRepo,NotesRead,Publisher,ProgressLine,ModelSvc,Outcome,Provider,SearchSec,DictSec,RoleSec,Fixture,PromptTest,GrepTest,ReportTest,EndingTest,GrepHarnessTest,FakeVault code
    class Sibling,SiblingTests sysrec
    class NavSpec,NavRepos,NavTests,GrepAnswer nav
    class Reaching unread
    class Artefact artefact

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
    class L1 prompt
    class L2 skill
    class L3 refdoc
    class L4 code
    class L5 sysrec
    class L6 nav
    class L7 unread
    class L8 artefact
```

Arrows: discovery path, source pointed me at the target.

## What each source decided

| Source                             | Impact | What it decided                                                                     |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| User prompt                        | high   | The six claims to verify, the sibling to read, the sections to drop                 |
| sdd SKILL.md                       | high   | The workflow: design file, decisions appended, criteria revisited, audit            |
| design-conventions.md              | high   | The section list and their order                                                     |
| unit-tests-format.md               | high   | The outline shape, and that the plan breaks out past 120 lines                      |
| acceptance-criteria-format.md      | medium | That a check the suite now covers comes out, which rewrote the grep criterion       |
| code-generation SKILL.md           | high   | Splitting NoteExcerpt into a value and a factory; the constructor append rule       |
| typescript.md                      | medium | Class over interface for the new values; where a defaulted parameter goes           |
| code-unit-tests SKILL.md           | medium | One test per branch, which shaped every outline leaf                                |
| text-generation SKILL.md           | high   | The 120-line limit that forced the design split, and the backtick discipline        |
| mermaid SKILL.md                   | medium | Quoted alt labels with the predicate moved to a Note over                           |
| spec 2-requirements.md             | high   | The seven changes, and the reference list that found most of the code               |
| spec 3-decisions.md                | high   | D1 to D4, implemented rather than reopened                                          |
| spec 4-acceptance-criteria.md      | high   | What the suite must not duplicate; the Exhausted-is-a-failure constraint            |
| architecture 1-overview.md         | high   | Package placement for every new file, and the construction rule                     |
| architecture 4-the-turn.md         | medium | Where an ending fits, and that everything under turn dies with the turn             |
| architecture 2-vocabulary.md       | low    | Confirmed turn and turn step usage; nothing was renamed as a result                 |
| architecture 5-asking-the-model.md | low    | Confirmed the prompt assembly order; no prompt text moved between files             |
| sibling 5-design                   | high   | That TagReport is a new file, so two of the three named collisions are not real     |
| sibling 6-unit-tests.md            | medium | Confirmed the sibling asserts nothing this design's rendering would break           |
| note-grep.ts                       | high   | matches[0].index at line 92, MAX_HITS 10, and the comment sizing it to one excerpt  |
| note-excerpt.ts                    | high   | The fixed 200-character window, and that it has one caller, so it can be replaced   |
| search-hit.ts                      | high   | That describe renders the row, so deleting it is part of the change                 |
| grep-request.ts                    | high   | Where the model's arguments are clamped, so the context cap lives there             |
| search-report.ts                   | high   | The three branches of ofGrep, and that total === 0 is the structured empty fact     |
| grep-result.ts                     | medium | wasTrimmed and readNothing, which the new rendering leaves alone                    |
| tool-schemas.ts                    | high   | The grep_notes schema the context argument joins, and its required list             |
| conversation-turn-runner.ts        | high   | The isStuck branch the found-nothing one copies                                     |
| turn-ending-kind.ts                | high   | Five values, so the two new ones make seven                                         |
| turn-outcomes.ts                   | high   | The split between endings that write history and those that do not                  |
| turn-ending-service.ts             | high   | That it holds the session repository, so it builds the continuation prompt          |
| repeated-refusal-counter.ts        | high   | The counter shape, its threshold of two, and its message method                     |
| tool-call-executor.ts              | high   | Where the refusal is recorded, so where the empty-search fact is recorded           |
| harness-results.ts                 | high   | That TextResult is the carrier for the empty-search fact                            |
| tool-call-outcome.ts               | high   | The last hop to the loop, and its paired-factory discipline                         |
| search-tools-service.ts            | high   | That it holds the result, so it knows total === 0 without parsing a report          |
| turn-repository.ts                 | high   | That notesRead is turn-built and pathsReturnedByVault session-supplied              |
| paths-returned-by-vault-repository | high   | Session-scoped and exposes only includes, which ruled it out of the prompt          |
| notes-read-repository.ts           | high   | Turn-scoped, and exposes only includes, so it needs an accessor                     |
| turn-progress-publisher.ts         | high   | One-way by design, which ruled the progress lines out of the prompt                 |
| mistral-provider.ts                | high   | parseResponse reads the status alone, so the overflow branch goes there             |
| search-section.ts                  | high   | The trailing unheaded group three rules join, and the Globbing rule left alone      |
| dictation-section.ts               | high   | The duplicate at lines 11 and 12, confirmed verbatim and adjacent                   |
| models-role.ts                     | medium | The refusal-announcement wording the new one is shaped after                        |
| release-3-prompt.txt               | high   | 33 lines, no gated word, duplicate as the last two lines: the two-line diff         |
| system-prompt.test.ts              | medium | The fixture assertion site and the re-record comment shape                          |
| search-report.test.ts              | high   | That ofGrep has no coverage at all, so the rendering tests are new                  |
| note-grep.test.ts                  | medium | The existing cases, so the plan says which stay and which change shape              |
| conversation-turn-runner-endings   | medium | That endings are asserted through EditEngine and the transcript                     |
| harness-tools-grep.test.ts         | low    | The construction shape; no design decision turned on it                             |
| fake-vault.ts                      | medium | That withNote takes multi-line content, so no test-support change is needed         |
| tool-dispatcher.ts                 | medium | That answerFromSearch needs no bound note, and its publisher path                   |
| turn-step-outcome.ts               | medium | The EndedTurn shape the two new endings build                                       |
| turn-spend.ts                      | medium | Where the new counter is held                                                       |
| outcome.ts                         | medium | The three states and FailureStep, for the overflow failure's shape                  |
| model-service.ts                   | medium | That the runner sees the failure through endTurnAsUnfinished                        |
| progress-line.ts                   | low    | The factory shape; no new line was needed                                           |
| grep for answer_from_search        | high   | Found the dispatcher's publish path in one call, unpointed by any document          |
| find of the four repositories      | medium | Located turn-repository, which the requirements named without a path                |
| ls of the test folders             | medium | Found that search-report.test.ts exists, which the requirements did not say         |
| ls of the spec folder              | low    | Confirmed the four files; the prompt already named them                             |
| 6-reaching-a-note.md               | not read | Pointed at by the overview and the sibling; no path question arose                 |

## Shape of the reference tree

- The requirements file is the hub. Its References section named twelve of the sixteen high-impact code reads, and every one of those was worth opening. A design phase that skipped it would have had to grep for the same files.
- The chain is short. Three hops is the deepest path: prompt to requirements to note-grep to note-excerpt. Nothing needed a fourth, which is what a good References section buys.
- The three highest-impact reads were not pointed at by any document. That search-report.test.ts has no ofGrep coverage came from an ls; that turn-repository distinguishes turn-built from session-supplied came from a find; the dispatcher's publish path came from a grep. All three changed the design.
- The sibling spec was the only system-of-record read, and it corrected the prompt. Two of the three collisions it was cited for are not collisions, and two real ones went unnamed.
- One dead end, and it was cheap. 6-reaching-a-note.md was pointed at twice and never opened, because no question about write permission arose. Its absence cost nothing.
