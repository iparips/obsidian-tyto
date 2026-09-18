---
created: 2026-09-18
updated: 2026-09-18
---

# Searching For A Misheard Name: Context Audit

What the design phase read, what each source decided, and what to change so the next phase reads less.

- [2-design-context.md](2-design-context.md) - the design phase: its discovery graph, the per-source table, and the shape of the reference tree
- [4-context-budget.md](4-context-budget.md) - the metered accounting, the blind spots, and the recommendations

Excluded from every number: the system prompt, the tool schemas, the always-on instruction files (the two CLAUDE.md files), and this agent's own output. The budget file states what the script could not see.

## Conventions

Arrows in the discovery graph run from a source to what it pointed at, labelled with the pointer that carried the link.

Colours mark the category a source came from.

| Category           | Covers                                                            |
| ------------------ | ----------------------------------------------------------------- |
| prompt             | the user's own message, the only node with no upstream source     |
| skill              | instruction files the harness or a skill trigger loaded           |
| reference document | the spec's own files, and the repo's architecture docs            |
| code               | source files under src, prefixed obsidian-tyto                    |
| system of record   | live state no document is trusted for: the sibling spec, git      |
| navigation         | listings, path searches, directory globs                          |
| never opened       | pointed at by something read, never opened; dashed outline        |
| artefact           | the files this phase produced; terminal nodes                     |

Impact is rated against the design that shipped, not against how interesting the read was.

| Rating        | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| high impact   | changed a decision in the design                     |
| medium impact | shaped wording, a test row, or a formatting choice   |
| low impact    | added a detail that could have been inferred         |
| no impact     | changed nothing                                      |
| not read      | pointed at, never opened                             |

## Categories

The category set splits by what a source can be trusted for, which is what decides whether it needed opening. A reference document states intent and can go stale; code is the only thing that settles a claim about behaviour; a system of record is live state that no document can stand in for.

This phase made that split load-bearing. The design prompt carried six code claims to verify and one instruction to distrust the spec, so nearly every high-impact row is code read to check a document, rather than a document read to learn something.

Navigation is separated from code because its cost is real and its impact is almost never high: it finds the file, and the file decides.
