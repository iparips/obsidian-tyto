---
created: 2026-09-14
updated: 2026-09-14
---

# Tasks

Four commits, one per folder, plus a fifth for the architecture doc. The suite
stays green at each, and no commit changes behaviour.

Each move is the same three steps: git mv the file, fix every import that named
it, run the suite. Tests move with the code they cover.

## Commit 1: the skill gate leaves tools

engine/skill-gating (new) takes applicable-skills, skill-declaration-checker and
skill-declaration-outcome, with their tests. ToolDispatcher is the only importer.

tools/ goes 16 to 13.

## Commit 2: the request values sit beside their readers

answer-request moves to waiting/ beside UserQuestionService, and choice-request
beside NoteChoiceService. ToolCallOutcome moves to the engine root beside
ToolDispatcher, its only reader.

tools/ goes 13 to 10, waiting/ 3 to 5, engine root 7 to 8.

## Commit 3: what a turn spends, and how it ends

engine/turn/spending (new) takes turn-spend, iteration-counter and
repeated-refusal-counter. engine/turn/ending (new) takes turn-outcomes,
turn-step-outcome and turn-ending-kind.

turn/ goes 14 to 8. TurnEndingKind is imported from session in four places, so
this commit touches session without changing it.

## Commit 4: views splits by kind

views/hooks (new) takes the four useX files. views/obsidian (new) takes
session-view, rebind-modal and tyto-icon.

views/ goes 17 to 9.

## Commit 5: the architecture doc matches the tree

The size table in
[architecture/7-package-design.md](../../architecture/7-package-design.md) is
re-counted, its "over the limit today" line removed, and the new folders added
to the package table with what each owns.

## After the commits

The suite proves behaviour is unchanged. Two checks it cannot make:

- Count the source files in every folder, excluding tests, and confirm none
  exceeds ten.
- Read the architecture doc against the tree and confirm every count matches.

A run against a real vault is not needed: no prompt text, schema or tool
behaviour moves.
