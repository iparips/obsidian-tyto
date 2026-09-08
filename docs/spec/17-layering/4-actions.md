# Actions

Ordered by how much each one helps a reader per unit of churn.

## 1. Stop two classes claiming to be repositories

SessionRepository and TurnRepository persist nothing. Renaming them stops the
word Repository meaning two things.

TurnState is taken, by the interface the harness tools read a turn through, so
the obvious pair is not available.

| Now               | Proposed      | Holds                                 |
| ----------------- | ------------- | ------------------------------------- |
| SessionRepository | SessionMemory | The chat history and target note      |
| TurnRepository    | TurnMemory    | What the turn resolved, opened, spent |

Eight files reference TurnRepository and eighteen reference SessionRepository,
so neither is a wide rename. Worth doing if the confusion is real rather than
theoretical, which is a judgement about the reader.

## 2. Name the fourth category in the code

The layered model has no slot for turn-scoped state, so a reader without this
document has to infer one. A package comment in engine/turn saying what that
package is would carry the same information as
[3-what-does-not.md](3-what-does-not.md) at the point of use.

Cheap, and it does not rename anything.

## 3. Consider a Service suffix, once the categories are settled

The original question. Applied to everything it would produce
NoteReaderService, TargetNoteResolverService, PromptBuilderService, which the
existing naming rule argues against: an agent noun already announces behaviour.

Applied only where the name is ambiguous it would touch a handful:
TurnConclusion, NoteChoice, UserQuestion, HarnessTools, SearchTools, TurnAskers.

The narrower reading is the defensible one, but neither is worth doing before
the categories above are agreed. A suffix that marks one category is only useful
once every category has a name.

## What not to do

Do not force the scoped-state classes into the three-layer model. They would
become either services holding state, which the readability rules forbid, or
repositories persisting nothing, which is the confusion this document starts
from.
