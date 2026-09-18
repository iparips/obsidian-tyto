---
created: 2026-09-18
updated: 2026-09-18
---

# Design Phase Context

The phase produced 5-design-listing-the-vaults-tags.md and 6-unit-tests.md, and corrected the requirements, the decisions, the acceptance criteria and the index. Conventions are in [1-index.md](1-index.md).

Cost: 53810 estimated read tokens across 60 reads. Code 21400, skill 16893, reference document 8500, navigation 6288, system of record 727, after re-bucketing the markdown reads the script filed as code. Just under half of it changed a decision. Full accounting in [4-context-budget.md](4-context-budget.md).

## Discovery path

```mermaid
flowchart LR
    Prompt["The design prompt<br/>0-prompt-design.md [high impact]"]
    Spec["obsidian-tyto spec/2026-09-18-suggesting-tags<br/>1 to 4 [high impact]"]
    Sdd["skills/sdd/SKILL.md [medium impact]"]
    DesignConv["skills/sdd/references/design-conventions.md [high impact]"]
    UnitConv["skills/sdd/references/unit-tests-format.md [medium impact]"]
    DecisionConv["skills/sdd/references/decisions-file-format.md [medium impact]"]
    AcceptConv["skills/sdd/references/acceptance-criteria-format.md [medium impact]"]
    TextGen["skills/text-generation/SKILL.md [medium impact]"]
    Mermaid["skills/mermaid/SKILL.md [medium impact]"]
    Arch6["obsidian-tyto docs/architecture/6-reaching-a-note.md [high impact]"]
    Arch1["obsidian-tyto docs/architecture/1-overview.md [high impact]"]
    Arch2["obsidian-tyto docs/architecture/2-vocabulary.md [low impact]"]
    Schemas["obsidian-tyto src/engine/tools/tool-schemas.ts [high impact]"]
    Harness["obsidian-tyto src/engine/tools/harness-tools-service.ts [high impact]"]
    SearchSvc["obsidian-tyto src/engine/tools/search-tools-service.ts [high impact]"]
    ToolCall["obsidian-tyto src/model/providers/models/tool-call.ts [medium impact]"]
    Glob["obsidian-tyto src/search/note-glob.ts and search-report.ts [high impact]"]
    Typings["obsidian-tyto node_modules/obsidian/obsidian.d.ts [high impact]"]
    Mocks["obsidian-tyto src/test-support [high impact]"]
    Tests["obsidian-tyto src/search/tests and engine/tools/tests [medium impact]"]
    PromptSrc["obsidian-tyto src/model/prompt [high impact]"]
    Factory["obsidian-tyto src/wiring/engine-factory.ts [medium impact]"]
    Precedent["obsidian-tyto spec/3-archived/2026-09-17f-multi-note-editing [medium impact]"]
    Git["git status and bun run test [medium impact]"]
    Arch5["obsidian-tyto docs/architecture/5-asking-the-model.md [not read]"]
    Arch4["obsidian-tyto docs/architecture/4-the-turn.md [not read]"]
    Grep["obsidian-tyto src/search/note-grep.ts [not read]"]
    Design["5-design-listing-the-vaults-tags.md and 6-unit-tests.md"]

    Prompt --> Spec
    Prompt --> Sdd
    Prompt --> Arch6
    Prompt --> Arch1
    Prompt --> Arch2
    Prompt --> Schemas
    Prompt --> SearchSvc
    Prompt --> Glob
    Prompt --> Factory
    Prompt --> Tests
    Prompt --> Mocks
    Sdd --> DesignConv
    Sdd --> UnitConv
    Sdd --> DecisionConv
    Sdd --> AcceptConv
    DesignConv --> Mermaid
    Sdd --> TextGen
    Spec --> Arch6
    Spec --> Arch5
    Spec --> Arch4
    Schemas --> ToolCall
    Schemas --> Harness
    SearchSvc --> Glob
    SearchSvc --> Grep
    Glob --> Typings
    Tests --> Mocks
    Prompt --> PromptSrc
    Arch1 --> Precedent
    Design --> Git

    Sdd --> Design
    DesignConv --> Design
    Spec --> Design
    Arch6 --> Design
    Arch1 --> Design
    Schemas --> Design
    Harness --> Design
    SearchSvc --> Design
    Typings --> Design
    Mocks --> Design
    PromptSrc --> Design

    classDef prompt fill:#d9e8fb,stroke:#3b6ea5
    classDef skill fill:#e8e0f5,stroke:#6b4fa0
    classDef refdoc fill:#dff0e0,stroke:#3f7d46
    classDef code fill:#fdf0d5,stroke:#b58a2b
    classDef record fill:#fadcdc,stroke:#a94442
    classDef unread fill:#f2f2f2,stroke:#999,stroke-dasharray: 4 3
    classDef artefact fill:#ffffff,stroke:#333,stroke-width:2px

    class Prompt prompt
    class Sdd,DesignConv,UnitConv,DecisionConv,AcceptConv,TextGen,Mermaid skill
    class Spec,Arch6,Arch1,Arch2,Precedent refdoc
    class Schemas,Harness,SearchSvc,ToolCall,Glob,Typings,Mocks,Tests,PromptSrc,Factory code
    class Git record
    class Arch5,Arch4,Grep unread
    class Design artefact

    subgraph LEGEND["Legend"]
        L1["prompt"]
        L2["skill"]
        L3["reference document"]
        L4["code"]
        L5["system of record"]
        L6["never opened"]
        L7["artefact"]
    end
    class L1 prompt
    class L2 skill
    class L3 refdoc
    class L4 code
    class L5 record
    class L6 unread
    class L7 artefact
```

Arrows: discovery path, source pointed me at the target.

## Per source

| Source                            | Impact   | What it decided                                                                       |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| 0-prompt-design.md                | high     | Named every code claim to verify, which is where two spec corrections came from       |
| 1 to 4 of this spec               | high     | D1 to D3 as given, the D4 lean the design then settled, and the criteria to revise    |
| design-conventions.md             | high     | Section order, the behaviour table shape, the one-diagram rule                        |
| 6-reaching-a-note.md              | high     | The argument settling D4: a returned path is a write-permission question              |
| 1-overview.md                     | high     | D5, via the package table, the construction rule and the ten-file limit               |
| tool-schemas.ts                   | high     | Where the gate sits, and the schema counts the behaviour table states                 |
| harness-tools-service.ts          | high     | That execute falls through to the shortlist, so a new branch must be explicit         |
| search-tools-service.ts           | high     | The method shape listTags copies, and that glob records paths where this will not     |
| note-glob.ts and search-report.ts | high     | The cap, the total-beside-rows result, and D6 on a reporter of its own                |
| obsidian.d.ts                     | high     | getAllTags as the one call covering frontmatter and inline, which the design rests on |
| src/test-support                  | high     | That the mock has no MetadataCache, making test support the first commit              |
| src/model/prompt                  | high     | That the release 3 fixture is search-off, correcting the requirements                 |
| sdd/SKILL.md                      | medium   | The workflow order and the file naming                                                |
| unit-tests-format.md              | medium   | The outline shape and the break-out rule                                              |
| decisions-file-format.md          | medium   | D5 to D7 as h3s with state markers, and where they sort                               |
| acceptance-criteria-format.md     | medium   | The three-to-six bar that cut two checks                                              |
| text-generation/SKILL.md          | medium   | Sentence length, no bold, keyboard characters only, the ToC threshold                 |
| mermaid/SKILL.md                  | medium   | The flowchart legend subgraph and the arrow legend line                               |
| tool-call.ts                      | medium   | That isHarnessTool and requiresVaultAccess are separate lists                         |
| src/search/tests and tools/tests  | medium   | The test files to follow, and that tool-catalogue.test.ts has no gating case yet      |
| engine-factory.ts                 | medium   | That app.metadataCache is reachable at the one legal construction site                |
| 2026-09-17f-multi-note-editing    | medium   | The house voice, and that 139 to 308 lines is normal for a design doc here            |
| git status and bun run test       | medium   | That nothing under src moved and 1420 tests pass                                      |
| 2-vocabulary.md                   | low      | Confirmed turn, target and progress line, none of which this change renames           |
| 5-asking-the-model.md             | not read | Pointed at by the requirements for prompt changes; src/model/prompt answered instead  |
| 4-the-turn.md                     | not read | Pointed at by 6-reaching-a-note.md; the tool parks no turn, so it never applied       |
| note-grep.ts                      | not read | Named beside note-glob.ts; the glob was the closer precedent for a capped result      |

## Shape

- The prompt is the hub, with eleven direct edges. It named the files to verify, which is why the code reads needed almost no search to find.
- The longest chain is four: prompt to sdd to design-conventions to mermaid. Every other path is two or three hops.
- Two of the three dead ends were architecture docs the spec pointed at. Both were skippable because the code answered the same question more exactly, which is the signal worth acting on.
- The two reads that settled a decision outright, obsidian.d.ts and 6-reaching-a-note.md, cost about 2850 tokens between them. Neither was among the ten most expensive.
- Nothing arrived without an inbound link. Every source was named by the prompt, by the spec, or by a skill.
