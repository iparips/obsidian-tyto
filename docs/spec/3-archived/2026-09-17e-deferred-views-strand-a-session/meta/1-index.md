---
created: 2026-09-17
updated: 2026-09-17
---

# Meta: Context Audit

What this spec's phases read, what each source decided, and where the tokens
went. Measured from the session transcripts, not recalled.

- [2-requirements-context.md](2-requirements-context.md) - the discovery path from the pasted transcript to the spec, and what each source decided
- [3-design-context.md](3-design-context.md) - the design phase, hubbed on the locator, and the four-hop chain that produced D7
- [4-context-budget.md](4-context-budget.md) - both phases by category and by impact, and what to change next time

Excluded from every count: the system prompt, tool schemas, the always-on
instruction files, and this audit's own prose.

## Conventions

Arrows in the discovery graph mean discovery: the source at the tail pointed at
the source at the head. A dashed outline means pointed at and never opened.

Colour key by category, per the template:

| Category     | Covers                                                     |
| ------------ | ---------------------------------------------------------- |
| prompt       | the user's own messages, the only nodes with no upstream   |
| skill        | instruction files the harness loaded on a trigger          |
| code         | source files in obsidian-tyto, prefixed with the repo name |
| external     | Obsidian's own documentation and typings                   |
| navigation   | listings, greps and path searches                          |
| never opened | pointed at, never opened                                   |
| artefact     | the spec files this phase produced                         |

Impact scale, used in the node labels and the per-source table:

| Rating        | Meaning                                      |
| ------------- | -------------------------------------------- |
| high impact   | changed a decision in the spec               |
| medium impact | shaped wording, a check, or a table row      |
| low impact    | added a detail that could have been inferred |
| no impact     | changed nothing                              |
| not read      | pointed at, never opened                     |

## Categories

Six rather than the template's eight. There was no system-of-record read worth a
category: one git status, folded into navigation. External is split out from
reference document because the phase's decisive reads were Obsidian's docs and
typings rather than anything in this repo's docs tree.

## Findings

Single-phase observations sit in the phase files. These need both to see.

The requirements phase was cheap and narrow, because the pasted transcript
carried the error message verbatim: one grep reached the failing line and
everything after was confirmation. Skills cost more than the code there, 13,096
tokens against 9,975 for eighteen reads.

The design phase inverted that, 21,706 code against 10,934 skill, and the cause
is not that it read more widely. It read the same subsystem in full rather than
the one file the error named. A requirements phase can stop at the failing line;
a design phase has to bound the change, and bounding it means opening every
caller whether or not it turns out to move.

Skills are fixed-cost across both, 24,030 of 64,822, or 37% of everything
measured. That is the number to attack if either phase gets cheaper, and the two
conventions recommendations in
[4-context-budget.md](4-context-budget.md) are where it starts.

The decisive read was neither phase's largest. D7, the one decision the design
overturned, came from a 31-token grep for the markdown extension guard. The
expensive reads confirmed what was already believed; the cheap one found what
was not.
