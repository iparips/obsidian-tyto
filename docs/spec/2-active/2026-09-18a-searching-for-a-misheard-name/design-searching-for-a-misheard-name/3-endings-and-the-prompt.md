---
created: 2026-09-18
updated: 2026-09-18
---

# Design: How A Turn Ends, And What The Model Is Told

The empty-search guard, the overflow ending and the four prompt rules. Part of [1-index.md](1-index.md).

## Counting searches that found nothing

EmptySearchCounter (Engine Turn Spending, new) joins TurnSpend (Engine Turn Spending) beside RepeatedRefusalCounter, and ends the turn at two consecutive empty searches.

Two rather than three, per D2's note that the design sets it. RepeatedRefusalCounter uses two, the two counters end the turn the same way, and a second nothing-matched search is rarely the one that works. The glob rules' widening pass is not the case this catches: a widened glob that matches is a success and clears the count, so only two in a row that both find nothing reach the guard.

The counter reads a structured fact, never a string. SearchToolsService (Engine Tools) already holds the GrepResult and the GlobResult, so it knows `result.total === 0` without parsing what SearchReport rendered. That fact travels on TextResult (Engine Tools), which gains one optional field:

```
TextResult (Engine Tools)   result, publishStepSummary, foundNothing?: boolean
```

Undefined means the call was not a search, which is every tool but the two. A glob or grep that matched nothing sets it true; one that matched sets it false, which is what clears the count. The alternative was having the counter reach into the search services, and passing the fact back is the repo's own rule that a tool reports and its owner reacts.

ToolCallOutcome (Engine) carries it the last hop to the loop, and ToolCallExecutor.executeToolCall (Engine Turn) records it beside the refusal it already records. The runner then reads it where it reads the refusal counter:

```
if (spend.emptySearchCounter.isStuck()) return TurnOutcomes.foundNothing(spend.emptySearchCounter)
```

That is the same shape as the stuck branch above it, and the ending is a distinct kind so the panel and the transcript can tell the two apart. Per the acceptance criteria an Exhausted ending here is the failure, so the ending has to be nameable.


## What the harness knows at overflow

TurnEndingService (Engine) builds the continuation prompt, and ContinuationPrompt (Engine Turn Ending, new) is the value it builds.

TurnEndingService is the collaborator because the ending writes to history, which is what separates it from TurnOutcomes (Engine Turn Ending). An overflow ending appends the model message saying the turn stopped, exactly as endTurnAsCancelled does, so it belongs on the side of the split that already holds the session repository.

### Which state it reads

Of the four the prompt names, it reads two, and the reasons the other two are out matter more than the ones they are in.

| Source                          | Scope   | Read | Why                                                          |
| ------------------------------- | ------- | ---- | ------------------------------------------------------------ |
| The utterance                   | Turn    | Yes  | What the user asked is the thing a fresh session must be told |
| NotesReadRepository             | Turn    | Yes  | The notes this turn read are what it had found                |
| PathsReturnedByVaultRepository  | Session | No   | Session-scoped, so it holds earlier turns' paths too          |
| The progress lines              | Turn    | No   | Published one way; the publisher returns nothing to read back |

PathsReturnedByVaultRepository is the one to be careful about. It is session-scoped by design, so a turn reading it at overflow would name paths a previous turn found and present them as this turn's findings. It also exposes only `includes`, so it cannot enumerate, and widening it to enumerate would be changing a session-scoped repository to serve one turn's ending. The notes actually read are the honest answer to "what had it found", and NotesReadRepository is turn-scoped, which is what makes it the right one.

The progress lines cannot be read at all. TurnProgressPublisher (Engine) is one-way by design and its own comment says so: nothing it holds returns anything the turn reads. A design that summarised the panel would need a second repository recording what was published, which is state duplicated to build one message.

Two consequences follow. NotesReadRepository gains a `getPathsRead` accessor, since it exposes only `includes` today. And the utterance has to reach the ending, which means TurnRepository (Engine Turn) holds it: it is turn-scoped state the turn does not currently keep, and it is the class that holds what one turn holds.

### Telling an overflow from a bad key

MistralProvider.parseResponse (Model Providers) keeps its shape and gains one branch before the generic one. A context overflow is a non-ok response whose body names it, so the branch reads the status and the body rather than the status alone.

```
if (ContextOverflow.isOverflow(response.status, body)) return Outcomes.failure(step, CONTEXT_OVERFLOW)
```

ContextOverflow (Model Providers, new) holds the recognition, so what counts as an overflow is one testable place rather than a condition inside a parse method. Per the requirements' own assumption this is the claim most likely to be wrong: if the provider does not make it identifiable, the recognition returns false, every overflow reads as an ordinary failure, and the ending degrades to the generic failure plus no continuation prompt. That is today's behaviour, so the degradation costs nothing beyond the feature.

The message is a sentinel the ending service matches rather than free text, since a failure message compared by string is how this would rot.

### What the ending says

The turn ends as TurnEndingKind.Overflowed (Engine Turn Ending, new), the sixth kind, and publishes the continuation prompt through publishModelAnswerFn (Engine) — the path answer_from_search already uses, so it lands as a copyable block with its clipboard button and no new panel work. The sources it carries are the paths read.

## The four prompt changes

Three go in SearchSection.rules (Model Prompt) and one in DictationSection.build (Model Prompt), per D3.

### In SearchSection, in the trailing unheaded group

The group already holds rules spanning both search tools, which is why these join it rather than the Globbing block.

- The question route, stated as a route rather than as a last step: read the candidates a search returned, then answer with answer_from_search listing every path the answer drew on. This replaces the existing single line, which names only the last step.
- Content already read outranks another search. Where a note read this turn answers the question, answer from it rather than searching for the spelling the user used.
- The empty-search announcement, in the shape ModelsRole (Model Prompt) uses for refusals: two searches in a row that find nothing end the turn, so answer from what has already been read, or say what could not be found.

The existing Globbing line "A glob that returned notes has answered the question. Offer what it found with choose_note" stays as it is. It is scoped to globs and to the edit path by its sub-heading, and the new question route is what covers the other case. Editing it would be a tidy-up on an unchanged path.

### In DictationSection, one rule

A spoken proper noun is the transcriber's guess at a sound, not the spelling. It holds in a vault with search off, where the model is writing the name down, so it is the half that can live in an unconditional section. The half that cannot — never re-grep a name one spelling already failed to find — goes in SearchSection with the others, per D3's split test.

Wording is a judgement no unit test makes. The suite asserts the text is present; the acceptance criteria decide whether the model acts on it.

## Re-recording the prompt fixture

The fixture is the review surface, per D3, and the diff has exactly two parts.

- One line deleted: the duplicated checkbox sentence, which is the last of the 33 lines.
- One line added: the transcription rule going into DictationSection.

Nothing else may move. Verified rather than assumed: the fixture contains no occurrence of search, glob, grep or choose_note, and SearchSection.build returns an empty array when search is off, so all three SearchSection rules are unreachable from it. A re-recorded fixture mentioning a search tool means a gated rule leaked into the ungated path, and the build stops rather than re-records.

The test's comment logs each prior re-record, so this one is added in the same shape.

## Where the spec is wrong

Two claims the code disagrees with, corrected here rather than designed around.

- The design prompt says the sibling spec touches three files this one touches: search-report.ts, note-glob.ts and tool-schemas.ts. Only the last is true. The sibling's design adds TagReport (Search, new) as a new file beside SearchReport and cites note-glob.ts only for MAX_GLOB_RESULTS as a precedent for its own cap. Its rollout writes neither. The real collisions are in [7-scope-and-rollout.md](7-scope-and-rollout.md), and they include two files the prompt does not name.
- The requirements call the empty-search guard one of two changes to the turn loop and place it at ConversationTurnRunner.isStuck. The guard needs a fact from the tool layer that nothing carries today, so it is four files rather than one: the counter, the field on TextResult, the field on ToolCallOutcome, and the runner branch. The spec's framing understates it, and a build planned as a one-line change to the runner would find nothing to read.

