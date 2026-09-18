---
created: 2026-09-18
updated: 2026-09-18
---

# Searching For A Misheard Name: Decisions

## Requirements

### Decisions

#### D4: What does a grep return for a note with many matches? [resolved 2026-09-18]

Every match, each with a context width the model asks for, and **no budget machinery yet**. Ilya: do not build the budget now; make sure the model can tell the user context ran out, and propose a prompt to continue with in a new session.

Today `NoteGrep.excerpt` returns one excerpt per note, taken from `matches[0].index`, 200 characters wide. A note matching fourteen times is reported as "14 matches" with the context of the first one, and the other thirteen are counted and discarded.

That is the defect behind turn 3. "What are some favorite things I've been doing with Cat over the last few months?" is answered by many matches spread over many notes, and the tool returns one arbitrary window per note. The question is unanswerable from that output however well the model behaves, so a prompt rule telling it to answer from excerpts would be telling it to answer from evidence it does not have.

The earlier framing in this spec got this wrong twice. It proposed a rule of the shape "a high match count means read the note in full", which is a workaround for the tool discarding the other matches rather than a fix. And it invoked NFR6 to justify the fixed payload, where NFR6 is "search cost stays bounded per turn regardless of vault size": bounded by the vault, which the hit cap already does, not by the matches inside one note. NFR7 is the relevant one, "note content leaving the vault stays limited to what the turn needs", and for a survey question every match in a matched note is what the turn needs.

The cost argues the same way. Ten hits today is about 500 tokens. Ten hits with all matches returned is a few thousand. Reading those ten notes in full, which is what the model must do now to answer properly, is about 10,000. Returning the matches is cheaper than the workaround it replaces and the answer is better.

So the tool change is:

- **Every match, no per-note cap.** The model sees them all and judges which matter, reading a note in full where it is the subject and ignoring a passing mention. A cap would make that judgement in the harness, which does not know the question.
- **The model picks the context width**, as a line count on `grep_notes`, defaulted around three and capped per match around fifteen. A fixed width is the harness guessing at what the question needs. Overlapping windows merge, as `grep -C` does, so two matches three lines apart are one block rather than two with the text between them twice.

##### What replaces the budget

A turn-wide token budget is a new concept here: nothing sets `max_tokens`, and the only per-turn ceiling is `IterationCounter`'s twenty steps. Building it means a number to tune, a seam for `NoteGrep` to read it through without becoming turn-aware, and a degradation path, all to prevent a failure nothing has yet observed. Returning every match makes a wide result larger, and a 128k window absorbs a great deal: 20 notes at 8 matches with 3 lines of context is around 22,000 tokens.

What the overflow costs today is the thing worth fixing, and it is much smaller. A context overflow comes back from the provider as a non-ok response, and `MistralProvider.parseResponse` turns any of those into `API responded 400:` plus a 200-character snippet of the provider's body. That reaches the user through `notifyFailed` as the turn's failure message. So a turn that overflows tells the user a raw provider error, does not say the cause was context, and offers no way forward.

Three things instead of a budget:

- **Name the cause.** A context-length overflow is recognised and reported as itself, not as an opaque 400. It is a distinguishable provider error, so the harness can tell it from a bad key or a rate limit.
- **Say what the turn did before it stopped.** A cancel already does this: `TurnOutcomes.cancelledNote` names the notes written. An overflow ending says what it had found, so the work is not silently lost.
- **Propose a continuation prompt.** The turn ends with text the user can carry into a fresh session: what they asked, and what the turn had found before it stopped. This is what makes an overflow recoverable rather than a dead end, and it costs nothing next to a budget.

One constraint the design must not miss: **the harness writes the continuation prompt, not the model.** An overflow is the model call failing, so there is no reply to ask for. Everything in that text has to come from what the harness already holds — the utterance, the paths in `PathsReturnedByVaultRepository`, the notes in `NotesReadRepository`, and the progress lines the panel has shown. A design that has the model summarise its own state cannot work on the one path this exists for.

The delivery mechanism exists. `answer_from_search` already reaches the panel as a copyable block with a clipboard button, rendered by `HistoryEntry`, so the continuation prompt is a copyable entry rather than text the user retypes. Reusing that keeps this small.

The budget stays out of scope and is worth revisiting once a real vault overflows. If it turns out to be needed, D4's earlier reasoning stands: fill note by note in sort order, complete match sets, and say what was dropped. Returning every match makes an overflow more likely than it is today, so this ordering is a deliberate bet that a clear failure and a way to resume beat a ceiling tuned against guesses.

#### D3: Where does the empty-search announcement live, given search can be off? [resolved 2026-09-18]

`SearchSection`. Ilya: the gate already exists, the guard only fires when search is on, and the rule's alternative is the read-outranks-search rule going into the same file.

D1 settles that the model is told, and points at `ModelsRole` for the shape. Where the text goes is a separate question, because the refusal rule it copies is unconditional and this one cannot be.

The release 3 fixture is a vault with no commands, no search and no skills, and it carries the refusal announcement at line 21. A rule about searches returning nothing would be nonsense in that vault: there is no search tool to run. So the announcement cannot simply join `ModelsRole`, or the fixture gains a line describing a capability the prompt has just said the model does not have.

| Option                                          | Cost                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `SearchSection`, which is already gated on search | A turn-ending rule sits among globbing advice rather than with the other limits |
| `ModelsRole`, gated like `reach` already is     | A second conditional in a section whose job is what is always true             |
| Its own gated section                           | A section for one rule                                                         |

Three of the four prompt changes therefore land in `SearchSection`: this announcement, the read-outranks-search rule, and the stated question route. They belong together, because the announcement's alternative is the other two. A rule that ends the turn for fruitless searching is only fair if the model has been told what to do instead.

The cost in the first row is real but small, and the placement answers it. The section's trailing unheaded lines already hold rules that span both search tools, and that is where these go rather than under `Globbing:`. Its stated cost was "among globbing advice", which only applies to the sub-headed blocks.

This keeps the release 3 fixture unchanged by all three `SearchSection` changes. Verified rather than assumed: the fixture contains no occurrence of "search", "glob", "grep" or "choose_note", so nothing gated on search reaches it.

The fixture still has to be re-recorded, and the build should know exactly how much of it moves.

- The duplicated `DictationSection` line is the only deliberate change to it. It is the last two lines of the fixture, so the re-record is a one-line deletion.
- The transcription rules are the open question the build has to settle, because `DictationSection` is unconditional and already owns how spoken input is treated. Rules about a misheard name therefore reach a vault with search off, where the model can neither search nor open another note. A rule saying "never re-grep a failed spelling" is meaningless there; one saying "a spoken proper noun is the transcriber's guess" is still true and still useful for content the model is writing down. The design splits them on that test, and whatever lands in `DictationSection` re-records the fixture beyond the one-line deletion.

That makes the fixture diff the review surface for this spec. A diff holding the one deleted line plus whatever `DictationSection` deliberately gained is correct; anything mentioning a search tool means a gated rule leaked into the ungated path.

The test's own comment already logs each prior re-record and the change that caused it, so this one is added there in the same shape.

#### D2: What counts as an unproductive search? [resolved 2026-09-18]

A search that returned no results. Ilya: a search whose results the model never read is a different issue, not a stricter version of this one.

That split is the right one, and it separates two defects that a single counter would have conflated.

**A search that returns nothing** is a model looking where the thing is not, or looking for something the vault does not hold. Turn 1 is four of them in a row: grep `Kat`, `catch up with Kat`, `catch up`, then `Kat` again over a wider path, each answered "no notes contain...". Repetition is the whole signal, so a counter is the right instrument and the ending is the right response.

**A search that returns paths the model never opens** is a model that does not know what to do next. Turns 3 and 5: 11 notes, then 92, then 29, and `read_note` on none of them.

| Turn | Call                         | Returned  | What the model did next |
| ---- | ---------------------------- | --------- | ----------------------- |
| 3    | grep `Kat`                   | 11 notes  | searched again          |
| 3    | grep `Kat`, `paths_only`     | 11 paths  | cancelled by the user   |
| 5    | grep `Cat`, `paths_only`     | 92 paths  | searched again          |
| 5    | grep `\bCat\b`, `paths_only` | 29 paths  | searched again          |

Counting those against the model treats the symptom. Two things caused them, and neither is fixed by ending the turn sooner. The route that answers a question is unstated end to end, so narrowing was the only instructed move for a long result. And per D4 the excerpts it was narrowing did not carry the answer: one window per note from the first match, with the other matches counted and thrown away. A counter there would fire on a model doing as it was told, with evidence that could not have answered the question anyway.

So the guard counts consecutive searches that returned nothing, and nothing else. This also removes the scope question the earlier framing raised: reading `NotesReadRepository` against `PathsReturnedByVaultRepository`, one turn-scoped and one session-scoped, is no longer needed. `SearchReport` already distinguishes the cases the counter reads, at `result.total === 0`, which is a structured fact rather than a matched string.

Threshold is the design's to set. Two is what `RepeatedRefusalCounter` uses and is defensible here, since a second nothing-matched search is rarely the one that works; three leaves room for a genuine widening pass, which the glob rules explicitly ask for after a miss.

#### D1: Does the empty-search guard end the turn, or only warn? [resolved 2026-09-18]

It ends the turn, **and the prompt says so before it fires**. Ilya: go with the recommendation. The second half is not optional, and the question that prompted it is the reason: a guard the model is not told about truncates a turn for a cause the model cannot see.

| Option                                | Cost                                                                 |
| ------------------------------------- | -------------------------------------------------------------------- |
| End the turn, as Stuck does           | A model two searches from the answer loses it                        |
| Feed the count back as a tool result  | Another string for the model to ignore, which is the defect already  |
| Warn the user, let the turn run       | The user is already watching; the warning adds nothing they can act on |

Ending it is the behaviour the user performed by hand three times in one session, which is the strongest evidence available that it is the right ending.

The precedent for announcing it is already in `ModelsRole`, for the other stuck-ending:

> A refusal is not a retry prompt. Repeating a call that was just refused ends the turn with nothing written, so read what the refusal asks for and do that instead; where nothing you can do satisfies it, stop and say what you need.

`RepeatedRefusalCounter` is therefore a guard the model is warned about by name, in the shape "doing X ends the turn, so do Y instead". The empty-search guard gets the same treatment, and the design owns the wording. Two properties it needs, both from the refusal rule:

- It names the consequence, so the ending is predictable rather than arbitrary.
- It names the alternative. A rule that only says "stop searching" leaves the model with no move; the refusal rule pairs its prohibition with "do what the refusal asks", and this one pairs with answering from what has already been read, which is the In Scope rule the failing turn needed at step 5.

This makes the prompt rule and the guard one change rather than two that happen to agree. Without the announcement the guard is a silent truncation; without the guard the announcement is another line the model may ignore, which the assumption about `mistral-medium-latest` says cannot be relied on. D3 settles where the text goes.

### Assumptions

- The duplicated `DictationSection` line is an editing slip, not two deliberately emphasised copies. Nothing in the file or its git history says otherwise, and no other section repeats a sentence. If it was deliberate, deleting it is still right: the same instruction twice in one system prompt is not stronger than once, and the fixture re-record makes the change visible either way.
- `mistral-medium-latest` will act on a stated rule about transcription. The session that failed had no such rule to ignore, so this is untested rather than known-ineffective. If the model keeps re-grepping a failed spelling with the rule in place, the guard in D1 is what stops the turn, and the prompt rule becomes the weaker half of the fix.
- Whether a suggested behaviour change works is a judgement, not an assertion. The unit suite can prove the prompt contains the text and the guard ends the turn; only a real vault and a real key say whether the model stops looping. That is why the acceptance criteria carry the behaviour checks.
- The split into separate rules holds: a transcription rule, a prefer-what-you-read rule, a stated question route, and a loop guard. One rule doing several of those jobs would be shorter, but the failing turn missed them at different moments, and a rule about names does not tell a model to stop searching or how to answer a question.
- A context overflow is distinguishable from other provider failures. The design rests on it: naming the cause means telling a context error apart from a bad key or a rate limit, and `parseResponse` currently reads only the status and a snippet. If the provider does not make it identifiable, the ending degrades to "the model could not answer this turn" plus the continuation prompt, which is still better than a raw 400 and still worth shipping.
- Returning every match will make overflows more common than they are today, and how much more is unknown. That is the bet D4 takes by leaving the budget out: a clear ending and a resumable prompt beat a ceiling tuned against guesses. If the acceptance run overflows often rather than rarely, the budget comes back into scope and D4 records the reasoning to pick up.
- The transcription rules divide cleanly on whether they mention searching. Per D3 that is what decides how much of them can sit in the unconditional `DictationSection`: "a spoken proper noun is the transcriber's guess" holds in a vault with search off, where "never re-grep a failed spelling" does not. If some rule turns out to need both halves in one sentence, it goes in `SearchSection` and a vault with search off loses it, which is the right trade because that vault cannot act on it anyway.

## Design

### Decisions

#### D8: What does MAX_HITS mean now that a hit is a block? [resolved 2026-09-18]

Six rather than ten, and it still means notes rather than matches.

Ten was sized for a row costing one 200-character excerpt, which note-grep.ts says in a comment beside the constant. A row is now a path header plus one line per merged window, so holding ten would roughly triple what a wide grep costs while keeping a cap tuned for the cheaper row.

Six hits at the default width is about 1,000 tokens against today's 500, which keeps a wide grep near what a wide grep costs today. The answer-quality argument runs the same way, and that is what D4 turns on: six notes seen properly beats ten seen through one window each, and the trimmed line still says how many were dropped.

MAX_PATHS stays at fifty. A paths-only row is a path, and nothing about it changed.

#### D7: Where does a merged excerpt's match count live? [resolved 2026-09-18]

On the excerpt, beside its line range.

A note matching fourteen times can render as nine blocks once windows merge. Without a per-excerpt count that reads as five matches going missing against the note's total, and the model's next move is a read_note the excerpts were meant to save.

The alternative was rendering each match separately and never merging, which sends the text between two near matches twice and is what grep -C avoids.

#### D6: Which collaborator builds the continuation prompt, and from what? [resolved 2026-09-18]

TurnEndingService, from the utterance and NotesReadRepository. Both are turn-scoped.

The service rather than TurnOutcomes because the ending writes to history, which is the split between those two classes. An overflow appends a model message saying the turn stopped, as endTurnAsCancelled already does.

Two sources are deliberately not read, and the reasons are the load-bearing half.

- PathsReturnedByVaultRepository is session-scoped, so a turn reading it would name paths an earlier turn found and present them as this turn's findings. It also exposes only includes, and widening a session-scoped repository to enumerate for one turn's ending is the wrong shape.
- The progress lines cannot be read at all. TurnProgressPublisher is one-way by design and its own comment says nothing it holds returns anything the turn reads. Summarising the panel would need a second repository recording what was published.

The cost is that TurnRepository has to hold the utterance, which it does not today, and NotesReadRepository gains an accessor beside its includes. Both are small and both are turn-scoped, which is the property that made them the right sources.

#### D5: How does the empty-search fact reach the turn loop? [resolved 2026-09-18]

As an optional boolean on TextResult, set by the search services and relayed by ToolCallOutcome.

SearchToolsService holds the GrepResult and the GlobResult, so it knows total === 0 without parsing what SearchReport rendered, which is what D2 asked for. Undefined means the call was not a search, false clears the count, true increments it.

The alternative was having the counter reach into the search services for their last result. Passing the fact back is the repo's own rule that a tool reports and its owner reacts, and it keeps the counter testable without a fake.

This makes the guard four files rather than the one the requirements imply: the counter, the field on TextResult, the field on ToolCallOutcome, and the runner branch. The requirements place it at ConversationTurnRunner.isStuck alone, which understates it, and a build planned that way would find no fact to read.

#### D9: Threshold for the empty-search guard [resolved 2026-09-18]

Two, which D2 left to the design.

RepeatedRefusalCounter uses two, the two counters end the turn the same way, and a second search that finds nothing is rarely the one that works. The glob rules' widening pass is not the case this catches: a widened search that matches is a success and clears the count, so only two in a row that both find nothing reach the guard.

### Assumptions

- The provider's overflow response is recognisable from its status and body together. ContextOverflow holds that recognition in one place so it is testable and replaceable. If it turns out not to be, isOverflow answers false, an overflow reads as an ordinary failure, and the ending degrades to today's behaviour with no continuation prompt. That is the degradation the requirements already accepted.
- Fifteen lines per match is a sensible ceiling. It is a screenful, past which a window stops being context and becomes the note, which read_note does better. The acceptance criteria's instruction to report how often the model still read a note in full afterwards is what tests it.
- Six hits is enough for a survey question. Ten with one window each was not, which is the observed failure; six with every match is the bet. If a real vault shows the model asking for a wider net rather than deeper evidence, the cap is one constant to move.
- Deleting SearchHit.describe is safe. It has one production caller, SearchReport.rows, and a value object that renders itself was tolerable at one line and is a second renderer at four.
