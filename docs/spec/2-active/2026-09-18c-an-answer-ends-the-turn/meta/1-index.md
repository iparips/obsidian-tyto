---
created: 2026-09-18
updated: 2026-09-18
---

# An Answer Ends The Turn: Context Audit

What the design phase read, what each read decided, and where the tokens went.

- [2-design-context.md](2-design-context.md) - the design phase: its discovery path, per-source ratings and shape notes
- [4-context-budget.md](4-context-budget.md) - the metered accounting, the blind spots, and what to change

Excluded throughout: the system prompt, tool schemas, the two always-on instruction files (the user's CLAUDE.md and the repo's), and this session's own output.

## Conventions

Arrows in the discovery graph mean: the source pointed me at the target. The edge label names the pointer that carried the link.

Colour key, by category:

| Category           | Covers                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| prompt             | the user's own message. The only node with no upstream source          |
| skill              | instruction files the harness or a skill trigger loaded                |
| reference document | the repo's architecture docs                                           |
| code               | source files under obsidian-tyto/src                                   |
| system of record   | live state no document can be trusted for: git, the suite, the spec    |
| navigation         | file listings, path searches, greps that only located a file           |
| never opened       | pointed at by something read, never opened. Dashed outline             |
| artefact           | the files the phase produced. Terminal node                            |

Impact scale, used in every node label and table row:

| Rating        | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| high impact   | changed a decision in the design                     |
| medium impact | shaped wording, a test row, or a formatting choice   |
| low impact    | added a detail that could have been inferred         |
| no impact     | changed nothing                                      |
| not read      | pointed at, never opened                             |

## Categories

The category set is the template's, with one local reading. This repo keeps its architecture docs in the checkout rather than in the notes vault, so reference document means docs/architecture and code means src. The distinction still earns its place: the architecture docs are the layer the design had to correct, and the design corrects two of them.

System of record covers three things here, all of them state a document would have got wrong: the git status that proved src stayed untouched, the suite run that proved it, and the spec files themselves, which the prompt described and the session had to confirm.
