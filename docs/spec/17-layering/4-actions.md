# Actions

Ordered by how much each one helps a reader per unit of churn. The renames are
done; what is left is one comment and one open question.

## Done

Four classes carried value object names while being mutable, and two records
said neither what they held nor who filled them.

| Was              | Now                            | Because                      |
| ---------------- | ------------------------------ | ---------------------------- |
| SeenPaths        | PathsReturnedByVaultRepository | A guard consults it          |
| ChosenNotes      | NotesChosenByUserRepository    | A guard consults it          |
| TurnCancellation | TurnCancellationController     | A switch, not a record       |
| IterationBudget  | IterationCounter               | Spent, not held              |
| TurnBudget       | NotesOpenedCounter             | Also said nothing about what |
| RepeatedRefusal  | RepeatedRefusalCounter         | Same shape as the other two  |

The naming rules behind them are in the code-generation skill, so the next class
of either shape gets the right name without this document.

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

## 2. Decide whether services take a suffix

The question this analysis started from, now answerable because every other
category has a name.

Applied to every service it would produce NoteReaderService,
TargetNoteResolverService and PromptBuilderService, which the naming rule argues
against: an agent noun already announces behaviour, and PromptBuilder is a
static factory rather than a service at all.

Applied where the name is ambiguous it touches a handful: TurnConclusion,
NoteChoice, UserQuestion, HarnessTools, SearchTools, TurnAskers. Each reads as
a noun or a collection while being behaviour.

The narrower reading is the defensible one. Whether it is worth the churn is a
judgement about how much the remaining ambiguity costs a reader.

## What not to do

Do not make every stateful class a Repository for consistency. The word already
covers two things here, and a third group would leave it meaning only that a
class has fields. TurnSpend is an entity, the three counters are counters, and
TurnCancellationController is none of them, which is more useful to a reader
than a suffix they all share.
