# What to Extract

## Five responsibilities

| Group           | Members                              |
| --------------- | ------------------------------------ |
| Session binding | followActiveNote                     |
| Single-flight   | the queue field, processUtterance    |
| The agent loop  | runAgentLoop, executeToolCalls       |
| Prompt assembly | askModel                             |
| Ending a turn   | five conclude methods, cancelledNote |

Only the third is what the class is named for.

## The strongest candidate: ending a turn

Five methods, each appending to chat history and wrapping an Outcome. They share
a shape the class does not name.

- concludeUtterance appends the summary and focuses the last edit
- concludeCancelled appends what the turn left, so the next one does not resume
- concludeUnfinished splits a provider failure from a cancel mid-flight
- concludeStuck reports the same refusal twice
- concludeExhausted reports the spent budget

Extracted as TurnConclusion, the loop would read as five named endings rather
than five methods sharing a prefix. It would take six methods out of the class,
and give the question "how can a turn end" one file to answer.

The cost is a collaborator holding sessionRepository and noteEditor, which
EditEngine would then hold only for its own use of them. Worth checking whether
anything else in the class still needs either afterwards.

## Second: the single-flight queue

Three lines and a field, but a distinct concern with the longest comment in the
class. It exists so a second utterance waits rather than interleaving, and so a
failure reaches the caller without poisoning the chain.

Small enough that extracting it may cost more than it saves. Worth doing only if
the conclusions move first and the class still reads as two things.

## Third: the model call

askModel takes five parameters, calls PromptBuilder four times, asks
HarnessTools five questions, and calls the provider. It is the whole of turning
a turn into a model call, and the only place either collaborator is used for
prompting.

Extracted as ModelCaller, both leave EditEngine with it. Six of the nine
remaining uses of the two are inside this one method.

## What the counts become

| Class          | Dependencies                                                   |
| -------------- | -------------------------------------------------------------- |
| EditEngine     | 4: turnFactory, modelCaller, turnConclusion, sessionRepository |
| UtteranceQueue | 1: the engine                                                  |
| ModelCaller    | 2: modelProvider, harnessTools                                 |
| TurnConclusion | 2: sessionRepository, noteEditor                               |

EditEngine goes from six to four, and nothing it gains holds more than two.

## The one that does not fit

turnProgressPublisher is used twice, for two unrelated things: the low-budget
warning inside the loop, and the retarget notice in followActiveNote. Neither
belongs to any class above.

followActiveNote is the thread worth pulling. It is the only method left that is
not about running a turn, and it is why EditEngine still holds both
sessionRepository and turnProgressPublisher. Moved to the plugin or a small
SessionBinding, the count drops again.

## What it read like afterwards

runAgentLoop is 17 lines and still reads as a loop: check the cancel, ask, end
on text, run the tools, count refusals, spend the budget. Every ending is now a
named call rather than a method three screens away.

No test changed, which is the signal worth having for an extraction: the seams
were already where the classes went.
