---
created: 2026-09-14
updated: 2026-09-14
---

# Tasks

Four commits, one per folder, plus a fifth for the architecture doc. The suite
stays green at each, and no commit changes behaviour.

Each move is the same three steps: git mv the file, fix every import that named
it, run the suite.

Tests do not all live beside their code here. engine/tools and session/views
keep a tests/ folder, so a test moves with the file it covers. engine/turn has
none: its tests sit in engine/tests, which they share with the engine root's.
Leave them there. Moving them would split that folder on a boundary this spec
did not choose, and tests are exempt from the limit anyway.

## Commit 1: the skill gate leaves tools

engine/skill-gating (new) takes applicable-skills, skill-declaration-checker and
skill-declaration-outcome. The two tests covering them move from
engine/tools/tests to engine/skill-gating/tests.

ToolDispatcher is the only importer outside the three files themselves, which
import each other.

tools/ goes 16 to 13.

## Commit 2: the request values sit beside their readers

answer-request moves to waiting/ beside UserQuestionService, and choice-request
beside NoteChoiceService. ToolCallOutcome moves to the engine root beside
ToolDispatcher, which builds it.

tools/ goes 13 to 10, waiting/ 3 to 5, engine root 7 to 8.

## Commit 3: what a turn spends, and how it ends

engine/turn/spending (new) takes turn-spend, iteration-counter and
repeated-refusal-counter. engine/turn/ending (new) takes turn-outcomes,
turn-step-outcome and turn-ending-kind.

turn/ goes 14 to 8. Their tests stay in engine/tests, per the note above.

TurnEndingKind has seven importers: turn-ending-service at the engine root, two
files inside the ending cluster itself, and four in session. This commit touches
session without changing it.

## Commit 4: views splits by kind

views/hooks (new) takes the four useX files, imported only by SessionPanel.
views/obsidian (new) takes session-view, rebind-modal and tyto-icon, imported
only by main.ts at the src root and by each other.

src/main.ts is outside every package and names all three, so it is the one
import fix that lands outside session.

The two tests covering session-view and tyto-icon move to
views/obsidian/tests. The hooks have none.

views/ goes 17 to 10.

## Commit 5: the architecture doc matches the tree

The size table in
[architecture/1-overview.md](../../../architecture/1-overview.md) is
re-counted, its "over the limit today" line removed, and the new folders added
to the package table with what each owns.

## After the commits

The suite proves behaviour is unchanged. Two checks it cannot make:

- Count the source files in every folder, excluding tests, and confirm none
  exceeds ten.
- Read the architecture doc against the tree and confirm every count matches.

A run against a real vault is not needed: no prompt text, schema or tool
behaviour moves.
