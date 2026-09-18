---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Context Audit

What this spec's phases read, what each read decided, and what a future prompt should say to skip the work that had to be discovered.

- [2-design-context.md](2-design-context.md) - the design phase: what it read, the discovery path, and the per-source ratings
- [3-context-budget.md](3-context-budget.md) - the metered accounting, the blind spots, and the recommendations

Only the design phase is audited. The requirements phase ran in another session and wrote no meta folder, so its cost is not recoverable here.

## What Is Excluded

The system prompt, the tool schemas, the always-on instruction files (CLAUDE.md at user and repo level), and this session's own output. The script meters tool results, so those sit outside the tables by construction.

## Conventions

Arrows in the discovery graph run from a source to what it pointed at, labelled with the pointer that carried the link.

| Category           | Covers                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| prompt             | the user's own messages, the only nodes with no upstream source         |
| skill              | instruction files loaded by the harness or a skill trigger              |
| code               | source files, prefixed with the repo name                               |
| reference document | the repo's own docs: architecture notes and sibling spec folders        |
| system of record   | live state no document can be trusted for: git, the test suite          |
| navigation         | file listings, path searches, directory globs                           |
| never opened       | pointed at by something read, never opened, drawn with a dashed outline |
| artefact           | the file the phase produced, a terminal node                            |

| Rating        | Meaning                                            |
| ------------- | -------------------------------------------------- |
| high impact   | changed a decision in the artefact                 |
| medium impact | shaped wording, a test row, or a formatting choice |
| low impact    | added a detail that could have been inferred       |
| no impact     | changed nothing                                    |
| not read      | pointed at, never opened                           |

## Why These Categories

The repo's own docs are split from its source, because they behave differently in this audit. Architecture docs were cheap and settled naming, where source files were expensive and settled facts. Collapsing them into one code row would hide that the expensive half was where the design's one correction came from.

System of record covers the test suite as well as git. A design phase that writes no production code still runs the suite, and here it did more than confirm a baseline: a throwaway test is what overturned the requirements' central claim.
