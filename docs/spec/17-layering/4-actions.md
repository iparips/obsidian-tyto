# Actions

Ordered by how much each one helps a reader per unit of churn. The renames are
done; what is left is one comment and one open question.

## Done

Four classes carried value object names while being mutable, two records said
neither what they held nor who filled them, and two named Builder build nothing
across calls.

| Was              | Now                            | Because                      |
| ---------------- | ------------------------------ | ---------------------------- |
| SeenPaths        | PathsReturnedByVaultRepository | A guard consults it          |
| ChosenNotes      | NotesChosenByUserRepository    | A guard consults it          |
| TurnCancellation | TurnCancellationController     | A switch, not a record       |
| IterationBudget  | IterationCounter               | Spent, not held              |
| TurnBudget       | NotesOpenedCounter             | Also said nothing about what |
| RepeatedRefusal  | RepeatedRefusalCounter         | Same shape as the other two  |
| PromptBuilder    | PromptFactory                  | Builds a ChatMessage         |
| ChainBudget      | AgentsMdChainFactory           | Builds an AgentsMdChain      |

A Builder accumulates across calls and neither does, so both are factories: they
take every argument at once and return the finished object.

Classes returning a string keep Builder, since the strings they assemble are the
complex thing. RuleBuilder, SearchReport and NoteExcerpt are all of that shape.
MistralMapper and NoteOperationParser keep their names, which already say what
they do.

The naming rules behind these are in the code-generation skill, so the next
class of either shape gets the right name without this document.

## 1. Make the scope visible where the classes live

Six classes carry the name Repository and two of them survive a reload. The
rest are in-memory, scoped to a turn or a session.

Renaming is not the fix: both readings of the word are defensible, and this
codebase now uses the broad one deliberately. What is missing is the scope. A
reader seeing SessionRepository cannot tell it from SkillRepository without
opening both.

A package comment in engine/turn stating that everything there dies with the
turn would carry that at the point of use, and rename nothing. The same comment
gives the scoped-state category in [3-what-does-not.md](3-what-does-not.md) the
name the layered model does not have.

## 2. Decide the six ambiguous service names

A Service suffix on every service would produce NoteReaderService and
TargetNoteResolverService, which the naming rule argues against: an agent noun
already announces behaviour.

Six names do not announce it, and are the open question. Each reads as a noun or
a collection while being injected behaviour.

| Class          | Reads as     | Is                                    |
| -------------- | ------------ | ------------------------------------- |
| TurnConclusion | A record     | Five ways of ending a turn            |
| NoteChoice     | A pick       | Parks the turn until the user answers |
| UserQuestion   | A question   | Parks the turn until the user answers |
| HarnessTools   | A collection | Runs the tool the model named         |
| SearchTools    | A collection | Globs and greps the vault             |
| TurnAskers     | A collection | Chooses who answers, per mode         |

The plurals are the weakest: HarnessTools and SearchTools promise collections
and hold none, which the plural rule in the naming skill already calls a
failure.

Undecided. The churn is small, and whether it is worth it depends on how much
the ambiguity costs when reading the dispatcher.

## What not to do

Do not make every stateful class a Repository for consistency. The word already
covers two things here, and a third group would leave it meaning only that a
class has fields. TurnSpend is an entity, the three counters are counters, and
TurnCancellationController is none of them, which is more useful to a reader
than a suffix they all share.
