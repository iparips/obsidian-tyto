---
created: 2026-09-14
updated: 2026-09-14
---

# Design

Four folders, four splits. Three find a concept already in the tree; one has no
concept to find and splits by kind.

## Goal

Bring every folder within the ten-file limit without moving a class between
packages or changing what any of them does.

## How each split was chosen

The code-generation skill's test, applied to each folder: what imports each
file. A cluster nothing outside it imports is a concept waiting to be named, and
naming it beats a kind split because each half then explains itself.

| Folder        | Concepts found                      | Split by |
| ------------- | ----------------------------------- | -------- |
| engine/tools  | Two, plus two values read elsewhere | Concept  |
| engine/turn   | Two                                 | Concept  |
| session/views | One                                 | Kind     |
| session       | Not over                            | Watched  |

## engine/tools: 16 to 10

Three files are the skill gate, imported only by ToolDispatcher and by nothing
in tools/. They move to engine/skill-gating (new):

- applicable-skills.ts
- skill-declaration-checker.ts
- skill-declaration-outcome.ts

Two more are request values that waiting/ reads. AnswerRequest is read by
UserQuestionService and ChoiceRequest by NoteChoiceService, so both sit beside
the service that reads them, which is where a value belongs:

- answer-request.ts moves to engine/waiting
- choice-request.ts moves to engine/waiting

That leaves tools/ holding eleven, so one more moves. ToolCallOutcome is what
every dispatched call returns, not a tool, so it moves to the engine root beside
ToolDispatcher, which builds it. NoteEditTool reads it too, from inside tools/.

waiting/ goes from 3 to 5 and stays well within the limit.

## engine/turn: 14 to 8

Two concepts come out. The first is what a turn spends, already named by
TurnSpend, which holds the other two. They move to engine/turn/spending (new):

- turn-spend.ts
- iteration-counter.ts
- repeated-refusal-counter.ts

The second is how a turn ends. TurnEndingService sits at the engine root and is
the only reader of all three, and TurnEndingKind is read from session as well.
They move to engine/turn/ending (new):

- turn-outcomes.ts
- turn-step-outcome.ts
- turn-ending-kind.ts

What is left in turn/ is the loop and the turn-scoped repositories, which is
what the architecture doc says the folder owns.

NotesOpenedCounter stays despite its name: engine/tools reads it, so it is turn
state the tools spend rather than part of the loop's own accounting.

## session/views: 17 to 10

The one folder with no second concept in it. Every file renders or feeds
something that renders, so the split is by kind, which is the skill's stage
three: a single subdomain that outgrew the limit.

| New folder      | Holds                                                          | Files |
| --------------- | -------------------------------------------------------------- | ----- |
| views/          | React components                                               | 10    |
| views/hooks/    | useEngineEvents, useParkedAnswers, useRecording, useTargetNote | 4     |
| views/obsidian/ | session-view, rebind-modal, tyto-icon                          | 3     |

The hooks folder is what AGENTS.md already describes: a subscription that only
dispatches goes in a hook declaring its own ports interface. The obsidian folder
holds what extends an Obsidian class rather than rendering React, which is the
placement test for it.

src/main.ts imports all three: session-view, rebind-modal and tyto-icon. It
sits outside every package, so it is the one import this spec fixes beyond the
folders it moves.

## session: watched, not split

Exactly ten. Splitting a folder that is not yet over invents a boundary rather
than finding one, so this spec records the count and leaves it. The next file
added to session/ is the one that forces the split.

## Where the tests live

Not uniformly beside the code. engine/tools and session/views each keep a
tests/ folder, so a test moves with the file it covers. engine/turn has none:
its tests sit in engine/tests alongside the engine root's, and they stay there.
Tests are exempt from the limit, so moving them buys nothing and would split
that folder on a boundary this spec did not choose.

## What does not change

- Every class name. Only the file's folder moves.
- Behaviour. No test changes except its import paths.
- The dependency direction. Every new folder sits inside the package that
  already held its files.
- The release 3 prompt fixture, which no file here touches.

## Test plan

The unit suite is the test: it passes unchanged except for import paths. Beyond
it, two checks the suite cannot make:

- Count the source files in every folder, excluding tests, and confirm none
  exceeds ten.
- Confirm the size table in
  [architecture/7-package-design.md](../../architecture/7-package-design.md)
  matches the tree, and that no folder is listed as over.

## Out of scope

- Splitting session/, which is at the limit rather than over it.
- Raising the limit. The architecture doc rejects that already.
- Counting tests folders against the limit.
- Any behaviour change. A split that needs one is the wrong split.

## References

- [2-requirements.md](2-requirements.md) - what is over and what may not change
- [architecture/7-package-design.md](../../architecture/7-package-design.md) - the size table this updates
- src/engine/tools - the skill gate, and the two request values waiting reads
- src/engine/turn/turn-spend.ts - the concept the spending folder is named for
