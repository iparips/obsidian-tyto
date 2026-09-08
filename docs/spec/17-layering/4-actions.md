# Actions

- [x] Rename the eight classes whose names said the wrong shape
- [x] Record the naming rules in the code-generation skill
- [x] Suffix the six ambiguous service names
- [x] Move the agent loop into the turn it drives
- [ ] Make the scope visible where the classes live

One option was considered and rejected, at the end.

## Done: eight renames

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

Left alone deliberately: classes returning a string keep Builder, since the
string is the complex thing. RuleBuilder, SearchReport and NoteExcerpt are all
of that shape. MistralMapper and NoteOperationParser keep names that already say
what they do.

## Done: the rules are in the skill

Three rules, so the next class of these shapes gets the right name without this
document.

- A plain noun promises a value object, so do not give one to something mutable,
  identity-bearing, or existing to be consulted
- A counter is not a value object either, though Budget and Quota read like one
- A class of static methods that construct is a Factory, not a Builder

## Done: six ambiguous service names

A Service suffix on every service would produce NoteReaderService and
TargetNoteResolverService, which the naming rule argues against: an agent noun
already announces behaviour.

Six names did not announce it. Each read as a noun or a collection while being
injected behaviour, so each took the suffix.

| Was            | Reads as     | Is                                    |
| -------------- | ------------ | ------------------------------------- |
| TurnConclusion | A record     | Five ways of ending a turn            |
| NoteChoice     | A pick       | Parks the turn until the user answers |
| UserQuestion   | A question   | Parks the turn until the user answers |
| HarnessTools   | A collection | Runs the tool the model named         |
| SearchTools    | A collection | Globs and greps the vault             |
| TurnAskers     | A collection | Chooses who answers, per mode         |

The three plurals were the weakest: they promised collections and held none,
which the plural rule in the naming skill already calls a failure.

Every other service keeps its agent noun. NoteReader, TargetNoteResolver and
NoteEditor say they act without a suffix, so adding one would only make them
longer.

## Not done: make the scope visible

Six classes carry the name Repository and two of them survive a reload. The rest
are in-memory, scoped to a turn or a session.

Renaming is not the fix: both readings of the word are defensible, and this
codebase uses the broad one deliberately. What is missing is the scope. A reader
seeing SessionRepository cannot tell it from SkillRepository without opening
both.

A package comment in engine/turn stating that everything there dies with the
turn would carry that at the point of use, and rename nothing. The same comment
gives the scoped-state category in [3-what-does-not.md](3-what-does-not.md) the
name the layered model does not have.

## Done: the loop moved into the turn

Chat history was written from five places across EditEngine and
TurnConclusionService, so neither owned recording. The cause was that the loop
sat outside the turn it drove: seven of nine private methods on EditEngine took
a turn as a parameter.

Turn now runs itself, TurnIteration runs one pass, and TurnFactory records the
utterance as it opens. All five writes are turn-scoped, and EditEngine dropped
from 159 lines to 47.

Designed in [5-design-self-running-turn.md](5-design-self-running-turn.md).

## Rejected: a Repository suffix for everything stateful

The word already covers two things here, and a third group would leave it
meaning only that a class has fields. TurnSpend is an entity, the three counters
are counters, and TurnCancellationController is none of them, which is more
useful to a reader than a suffix they all share.
