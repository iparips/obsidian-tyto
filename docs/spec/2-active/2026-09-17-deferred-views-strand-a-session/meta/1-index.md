---
created: 2026-09-17
updated: 2026-09-17
---

# Meta: Context Audit

What this spec's requirements phase read, what each source decided, and where
the tokens went. Measured from the session transcript, not recalled.

- [2-requirements-context.md](2-requirements-context.md) - the discovery path from the pasted transcript to the spec, and what each source decided
- [4-context-budget.md](4-context-budget.md) - the token split by category and by impact, and what to change next time

Excluded from every count: the system prompt, tool schemas, the always-on
instruction files, and this audit's own prose.

## Conventions

Arrows in the discovery graph mean discovery: the source at the tail pointed at
the source at the head. A dashed outline means pointed at and never opened.

Colour key by category, per the template:

| Category    | Covers                                                        |
| ----------- | ------------------------------------------------------------- |
| prompt      | the user's own messages, the only nodes with no upstream       |
| skill       | instruction files the harness loaded on a trigger              |
| code        | source files in obsidian-tyto, prefixed with the repo name     |
| external    | Obsidian's own documentation and typings                       |
| navigation  | listings, greps and path searches                             |
| never opened| pointed at, never opened                                       |
| artefact    | the spec files this phase produced                             |

Impact scale, used in the node labels and the per-source table:

| Rating        | Meaning                                    |
| ------------- | ------------------------------------------ |
| high impact   | changed a decision in the spec              |
| medium impact | shaped wording, a check, or a table row     |
| low impact    | added a detail that could have been inferred |
| no impact     | changed nothing                             |
| not read      | pointed at, never opened                    |

## Categories

Six rather than the template's eight. There was no system-of-record read worth a
category: one git status, folded into navigation. External is split out from
reference document because the phase's decisive reads were Obsidian's docs and
typings rather than anything in this repo's docs tree.

## Findings

The phase was cheap and the reading was narrow, because the pasted transcript
carried the error message verbatim. One grep on that message reached the failing
line, and everything after it was confirmation.

Skills cost more than the code. Three skill bodies plus their format references
came to 13,096 tokens against 9,975 for eighteen code reads. That is the shape
of a small bug spec: the artefact rules are fixed-cost and the investigation is
not.
