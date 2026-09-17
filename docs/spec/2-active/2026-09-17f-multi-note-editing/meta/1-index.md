---
created: 2026-09-18
updated: 2026-09-18
---

# Meta: Multi-Note Editing

What the design phase read, what each source changed, and what it cost.

- [2-design-context.md](2-design-context.md) - the discovery path from the prompt to the design doc, and what each source decided
- [4-context-budget.md](4-context-budget.md) - the metered accounting and what to change next time

Excluded from every count: the system prompt, tool schemas, the two always-on instruction files (the user's CLAUDE.md and the repo's), and this audit's own output.

## Conventions

Arrows run from a source to what it pointed at, labelled with the pointer that carried the link.

| Category           | Covers                                                             |
| ------------------ | ------------------------------------------------------------------ |
| prompt             | the user's own message. The only node with no upstream source      |
| skill              | instruction files loaded by the harness or a skill trigger         |
| code               | source files in obsidian-tyto, prefixed with the repo name         |
| reference document | the repo's own docs: the spec folder and docs/architecture         |
| system of record   | live state no document can be trusted for: the test suite, git     |
| navigation         | file listings, path searches, directory globs                      |
| never opened       | pointed at by something read, never opened. Dashed outline         |
| artefact           | the files this phase produced. Terminal nodes                      |

| Rating        | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| high impact   | changed a decision in the artefact                   |
| medium impact | shaped wording, a test row, or a formatting choice   |
| low impact    | added a detail that could have been inferred         |
| no impact     | changed nothing                                      |
| not read      | pointed at, never opened                             |

## Categories

The category set splits the repo's own docs from its code, because they behaved differently. The spec folder and docs/architecture were handed over by the prompt and read once; the code was reached by following names out of them, and is where the design's two new decisions came from.

System of record earns a row for one reason: the prompt said to verify five claims about code before trusting them, and the suite's 1400 passing tests is the only evidence the design rests on a green baseline.
