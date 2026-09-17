---
created: 2026-09-18
updated: 2026-09-18
---

# Design Phase Context

The phase produced 5-design-stable-step-target.md and 6-unit-tests.md, resolved D3, added D5 and D6, and cut one acceptance check. Conventions are in [1-index.md](1-index.md).

Cost: about 51,300 estimated read tokens. By category: code 32,600, skill 14,400, navigation 3,700, system of record 600. By impact: high 12,900, medium 21,400, low 11,600, none 5,400. The accounting is in [4-context-budget.md](4-context-budget.md).

## Discovery path

```mermaid
flowchart LR
    Prompt["The user prompt<br/>[high impact]"]

    SddSkill["skills/sdd/SKILL.md<br/>[high impact]"]
    DesignConv["sdd/references/design-conventions.md<br/>[high impact]"]
    UnitFmt["sdd/references/unit-tests-format.md<br/>[high impact]"]
    DecisionFmt["sdd/references/decisions-file-format.md<br/>[high impact]"]
    AcceptFmt["sdd/references/acceptance-criteria-format.md<br/>[medium impact]"]
    TextGen["skills/text-generation/SKILL.md<br/>[medium impact]"]
    Mermaid["skills/mermaid/SKILL.md<br/>[medium impact]"]

    Index["spec/2026-09-17f/1-index.md<br/>[low impact]"]
    Reqs["spec/2026-09-17f/2-requirements.md<br/>[high impact]"]
    Decisions["spec/2026-09-17f/3-decisions.md<br/>[high impact]"]
    Accept["spec/2026-09-17f/4-acceptance-criteria.md<br/>[medium impact]"]

    Reaching["tyto docs/architecture/6-reaching-a-note.md<br/>[medium impact]"]
    Vocab["tyto docs/architecture/2-vocabulary.md<br/>[medium impact]"]
    TheTurn["tyto docs/architecture/4-the-turn.md<br/>[low impact]"]

    Executor["tyto src/engine/turn/tool-call-executor.ts<br/>[high impact]"]
    Dispatcher["tyto src/engine/tool-dispatcher.ts<br/>[high impact]"]
    SessionRepo["tyto src/session/session-repository.ts<br/>[high impact]"]
    TurnRepo["tyto src/engine/turn/turn-repository.ts<br/>[high impact]"]
    Runner["tyto src/engine/turn/conversation-turn-runner.ts<br/>[high impact]"]
    Counters["tyto src/engine/turn/spending<br/>[high impact]"]
    ModelSvc["tyto src/engine/turn/model-service.ts<br/>[low impact]"]
    ToolCall["tyto src/model/providers/models/tool-call.ts<br/>[medium impact]"]
    Outcome["tyto src/engine/tool-call-outcome.ts<br/>[medium impact]"]
    Resolver["tyto src/engine/note-binding/target-note-resolver.ts<br/>[medium impact]"]
    OpenNote["tyto src/engine/note-editing/open-note.ts<br/>[medium impact]"]
    CommandModel["tyto src/commands/models/note-opened-by-obsidian-command.ts<br/>[medium impact]"]
    Role["tyto src/model/prompt/system-prompt-sections/models-role.ts<br/>[high impact]"]

    EditTests["tyto src/engine/tests/edit-engine.test.ts<br/>[high impact]"]
    HarnessTests["tyto src/engine/tests/edit-engine-harness.test.ts<br/>[high impact]"]
    ChosenTests["tyto src/engine/tests/edit-engine-model-chosen.test.ts<br/>[high impact]"]
    PromptTests["tyto src/model/prompt/tests/system-prompt.test.ts<br/>[medium impact]"]
    Builders["tyto src/test-support/builders.ts<br/>[medium impact]"]
    Nav["ls of src/engine/tests and src/test-support<br/>[medium impact]"]

    Suite["bun run test, 1400 passing<br/>[medium impact]"]

    PromptDesign["spec/2026-09-17f/0-prompt-design.md<br/>[not read]"]
    ChoiceSvc["tyto src/engine/waiting/note-choice-service.ts<br/>[not read]"]

    Design["spec/2026-09-17f/5-design-stable-step-target.md"]
    Tests["spec/2026-09-17f/6-unit-tests.md"]

    Prompt -->|names the skill| SddSkill
    Prompt -->|names the files in order| Index
    Prompt -->|names the claims to verify| Executor
    Prompt -->|names the prompt site| Role
    Prompt -->|names the test file| EditTests
    Prompt -->|names the architecture reads| Reaching
    Prompt -->|post-write rule| TextGen

    SddSkill -->|workflow step| DesignConv
    SddSkill -->|workflow step| DecisionFmt
    SddSkill -->|workflow step| AcceptFmt
    DesignConv -->|breaking it out| UnitFmt
    DesignConv -->|diagrams are mermaid| Mermaid

    Index -->|file list| Reqs
    Index -->|file list| Decisions
    Index -->|file list| Accept
    Index -.->|file list| PromptDesign
    Reqs -->|references| Dispatcher
    Reqs -->|references| ToolCall
    Reqs -->|references| Vocab
    Reqs -.->|references| ChoiceSvc
    Reaching -->|references| Vocab
    Vocab -->|references| TheTurn

    Executor -->|imports| TurnRepo
    Executor -->|imports| Outcome
    Executor -->|calls| Dispatcher
    Executor -->|grep for callers| Runner
    Runner -->|imports| Counters
    Dispatcher -->|binds| SessionRepo
    Dispatcher -->|resolves through| Resolver
    Dispatcher -->|reads| CommandModel
    TurnRepo -->|returns| OpenNote

    EditTests -->|imports| Builders
    Nav -->|sibling files| HarnessTests
    Nav -->|sibling files| ChosenTests
    Builders -->|wiring| Nav
    Role -->|fixture guard| PromptTests

    SessionRepo -->|D5| Design
    TurnRepo -->|D5| Design
    Runner -->|D3| Design
    Counters -->|D3| Design
    Executor -->|D6| Design
    ToolCall -->|D6| Design
    Role -->|prompt section| Design
    Reqs -->|scope| Design
    Decisions -->|D1, D2, D4| Design
    DesignConv -->|section order| Design
    Mermaid -->|diagram shape| Design

    HarnessTests -->|command cases| Tests
    ChosenTests -->|open_note cases| Tests
    EditTests -->|existing edit cases| Tests
    Resolver -->|unresolvable case| Tests
    CommandModel -->|opened-nothing case| Tests
    UnitFmt -->|outline shape| Tests
    Suite -->|green baseline| Tests

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

    classDef prompt fill:#4a5568,stroke:#2d3748,color:#fff
    classDef skill fill:#805ad5,stroke:#553c9a,color:#fff
    classDef refdoc fill:#3182ce,stroke:#2c5282,color:#fff
    classDef code fill:#2f855a,stroke:#22543d,color:#fff
    classDef sor fill:#b7791f,stroke:#975a16,color:#fff
    classDef nav fill:#718096,stroke:#4a5568,color:#fff
    classDef unopened fill:#e2e8f0,stroke:#a0aec0,color:#2d3748,stroke-dasharray: 5 5
    classDef artefact fill:#c53030,stroke:#822727,color:#fff

    class Prompt,L1 prompt
    class SddSkill,DesignConv,UnitFmt,DecisionFmt,AcceptFmt,TextGen,Mermaid,L2 skill
    class Index,Reqs,Decisions,Accept,Reaching,Vocab,TheTurn,L3 refdoc
    class Executor,Dispatcher,SessionRepo,TurnRepo,Runner,Counters,ModelSvc,ToolCall,Outcome,Resolver,OpenNote,CommandModel,Role,EditTests,HarnessTests,ChosenTests,PromptTests,Builders,L4 code
    class Suite,L5 sor
    class Nav,L6 nav
    class PromptDesign,ChoiceSvc,L7 unopened
    class Design,Tests,L8 artefact
```

Arrows: discovery path, source pointed me at the target.

## What each source decided

| Source                          | Impact | What it decided                                                                       |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| The user prompt                 | high   | Scope, D3 as mine to settle, the five claims to verify, and no build run              |
| session-repository.ts           | high   | D5: bindTo runs unconditionally, so the session's path is the target the guard reads  |
| turn-repository.ts              | high   | D5's other half: retargetTo is conditional, so the turn's note misses a failed resolve |
| conversation-turn-runner.ts     | high   | D3: spendOn counts the whole batch, so a refused call already spends                  |
| spending counters               | high   | D3's cost: changing it needs a new return shape for two steps in twenty               |
| tool-call-executor.ts           | high   | D6: the edit rule reads a call before dispatch and cannot move after it               |
| tool-dispatcher.ts              | high   | Both retarget routes reach line 308, and moveTargetNote returns early on a no-op      |
| 2-requirements.md               | high   | The rule, the two tools, and the refusal shape to match                                |
| 3-decisions.md                  | high   | D1, D2 and D4 as settled inputs the design implements                                 |
| models-role.ts                  | high   | The prompt line belongs in widenedReach, which leaves the fixture green               |
| edit-engine.test.ts             | high   | The three-edit batch and search-then-edit cases the new guard must not break          |
| edit-engine-harness.test.ts     | high   | The command cases land here; it already drives both open and opened-nothing           |
| edit-engine-model-chosen.test.ts| high   | The open_note cases land here; it already runs glob, choose and open end to end       |
| sdd skill and design-conventions| high   | Section order, the flag preflight, and that the flag sections get dropped              |
| unit-tests-format.md            | high   | Breaking the plan out to 6-unit-tests.md past 120 lines                                |
| decisions-file-format.md        | high   | Resolved last, the Design section, and the answer as the first body line              |
| target-note-resolver.ts         | medium | resolveOrNothing returns null on a miss, which is the unresolvable-retarget test case |
| note-opened-by-obsidian-command | medium | rebinds() false is the no-op command, and its refusal does reach the counter          |
| tool-call.ts                    | medium | No retargets() predicate: it would answer what a call might do, not what the target did |
| tool-call-outcome.ts            | medium | refused() carries the reason the counter reads, so the new refusal must bypass it     |
| open-note.ts                    | medium | The turn's target is an object, so the session's string is the cheaper comparison     |
| builders.ts and the tests ls    | medium | Which file each test case lands in, and that no new fake is needed                    |
| system-prompt.test.ts           | medium | The fixture is a raw import, so any always-stated line re-records it                  |
| 6-reaching-a-note.md            | medium | Target and retarget as the architecture defines them, and the three routes            |
| 2-vocabulary.md                 | medium | Turn step versus progress line, and retarget as the word for the move                 |
| 4-acceptance-criteria.md        | medium | Which check the unit plan now covers, so it came out                                  |
| acceptance-criteria-format.md   | medium | The bar for removing a check: anything the suite asserts                              |
| text-generation skill           | medium | Prose shape, table padding, no bold, one line per paragraph                           |
| mermaid skill                   | medium | Rewrote the sequence diagram: method-name labels and client-to-supplier arrows        |
| bun run test                    | medium | 1400 green, so the plan rests on a known baseline and src stayed untouched            |
| 4-the-turn.md                   | low    | Engine's folder table, confirming the guard stays in turn/                            |
| model-service.ts                | low    | Confirmed the once-per-step read, which the prompt had already stated                 |
| 1-index.md                      | low    | Framing already carried by the requirements                                            |
| 0-prompt-design.md              | not read | Its content was the user prompt, so opening it would have duplicated the turn        |
| note-choice-service.ts          | not read | Auto versus confirm mode does not change a rule about the target moving              |

## Shape notes

- The prompt is the hub. It named seven of the eight starting points directly, including all five code claims to verify, so the chains are short: most sources are two hops from it.
- The deepest chain is four hops and it is the one that mattered: prompt to executor to dispatcher to session-repository, which is where D5 came from. Nothing in the spec folder pointed at session-repository.ts.
- Two sources contradicted the spec and both were code. D4's body says the guard can read turnRepository.targetNote(); reading both repositories showed that misses an unresolvable retarget, which became D5. The requirements' reference list offers isEditTool as the model for a new predicate; D4 rules that predicate out.
- Two dead ends, both cheap and both correct to skip. 0-prompt-design.md is the user prompt in a file, and note-choice-service.ts answers a question the rule is indifferent to.
- The test files have no inbound link from any spec document. They were reached through a directory listing, which is the one piece of navigation that paid for itself.
