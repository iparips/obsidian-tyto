# Actions

Ordered by how much each one helps a reader per unit of churn.

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

## 2. Leave TurnCancellationController unlabelled

It holds one flag that flips once, and hands out an AbortSignal and a promise.
No block names it, and forcing one would mislead rather than help. Better to say
so than to file it wrongly.

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

Do not make every stateful class a Repository for consistency. The word already
covers two things here, and a third group would leave it meaning only that a
class has fields. TurnSpend is an entity and TurnCancellationController is neither, which
is more useful to a reader than a suffix they all share.
