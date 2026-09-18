---
created: 2026-09-18
updated: 2026-09-18
---

# Meta: Suggesting Tags

What this spec's phases read, what each read changed, and what it cost.

- [2-design-context.md](2-design-context.md) - the design phase: its discovery path, its per-source ratings and the shape of its reference tree
- [4-context-budget.md](4-context-budget.md) - the metered accounting and what to change in the prompts, the docs and the skills

Excluded throughout: the system prompt, tool schemas, always-on instruction files such as CLAUDE.md, and the agent's own output. Skill bodies are measured on disk rather than from the transcript, which the budget states as a blind spot.

## Conventions

Arrows in the discovery graph run from a source to what it pointed at, labelled with the pointer that carried the link.

| Category           | Covers                                                          |
| ------------------ | --------------------------------------------------------------- |
| prompt             | the user's own messages, the only nodes with no upstream source |
| skill              | instruction files loaded by the harness or a skill trigger      |
| reference document | the repo's architecture docs and this spec's own files          |
| code               | source files under src, plus the obsidian typings               |
| system of record   | live state no document can be trusted for: git, the test run    |
| navigation         | file listings, path searches, directory globs                   |
| never opened       | pointed at by something read, never opened; dashed outline      |
| artefact           | the file the phase produced; terminal node                      |

| Rating        | Meaning                                            |
| ------------- | -------------------------------------------------- |
| high impact   | changed a decision in the artefact                 |
| medium impact | shaped wording, a test row, or a formatting choice |
| low impact    | added a detail that could have been inferred       |
| no impact     | changed nothing                                    |
| not read      | pointed at, never opened                           |

## Categories

Reference document is split from code because this repo's architecture docs carry rules a reader cannot grep, and the audit's whole question is whether those docs earned their place. The script buckets a `cat` of a markdown file as code, so every such row is re-bucketed by hand.

System of record holds two rows only: the git status proving nothing under src moved, and the test run. Both are claims the design makes that no document could support.
