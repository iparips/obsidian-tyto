---
created: 2026-09-18
updated: 2026-09-18
---

# Searching For A Misheard Name

## Motivation

A voice harness never receives the name the user said. It receives what the transcriber guessed, and for a proper noun the guess is often wrong: one session spelled the same person Jon, John and "Jonah's Sea" across five turns and never found her. The vault held the answer the whole time, in a note the model had already read.

The session that showed this burned 31 turn steps over five turns and answered one question. Three of the five turns ended with the user hitting stop, because the model was grepping for a spelling instead of reading the note in front of it.

The prompt is most of the cause. It tells the model how to glob for a path it has not seen, at length, and says nothing about a name it cannot trust. Four defects follow from that gap: no rule that a spoken name is approximate, no rule that a note already read outranks another search, no stated route for answering a question, and no guard treating a run of fruitless searches as a turn going nowhere. A fifth is a plain duplication bug in the same file.

The sixth is not in the prompt, and it is the one that decides answer quality. `NoteGrep` returns one excerpt per matched note, taken from the first match, and counts the rest without showing them, so a question answered by many matches across many notes cannot be answered from a grep at all.

The model was not ignoring what it found. Every rule it had about a large result set was about refining the query, the trim line on a long result ends "narrow the pattern to see the rest", and the excerpts it was narrowing would not have answered the question anyway. It narrowed because that is what it was told to do, which is why the fix states a route rather than adding a rule against narrowing.

That separates two failures a single guard would have conflated, per D2. A search returning nothing repeatedly is a turn going nowhere and the guard ends it. A search returning paths the model never opens is a model with no stated next move and evidence that could not have answered the question, and neither is fixed by ending the turn sooner.

### What the transcript shows

The model read `09-17-Thu.md` at turn 1 step 5 and got back a note titled `# Coffee with John`, tagged `#reflection/john/coffee`. Both spell the name. The question "did I enjoy my catch up with Jon yesterday?" was answerable from that content alone.

Instead the model ran four consecutive greps: `Jon`, then `catch up with Jon`, then `catch up`, then `Jon` again over a wider path. Each returned nothing, and nothing in the harness or the prompt treated a run of empty searches as a signal to stop and use what had already been read.

Turns 3 and 5 repeat the shape without the read: grep a spelling, get 11 or 92 paths back, list them, read none, get cancelled.

### What is not wrong

Two things that look like harness bugs on a first read, and are not. Both were checked against the code and a reproduction before being ruled out, and they are recorded so the build does not re-open them.

- **The chat history is well formed across a cancel.** A cancelled turn appends the in-flight tool result, then the cancellation note, then the next utterance, in that order. A reproduction against `EditEngine` confirmed the sequence. The dispatcher already refuses to run a call once cancelled, in `ToolDispatcher.execute`.
- **The transcript is not misrendering.** A step's tool result is rendered at the top of the _next_ step's Request block by design, which `TranscriptTurnStep` states in a comment. Across a turn boundary that reads as a result leaking into a later turn; the underlying history is correct.

So the leaked-context reading is wrong, and no engine change is needed for it. What is left is model guidance and one no-progress guard.

## In Scope

Seven changes: two to code that the prompt rules depend on, four to the prompt, and one to the turn loop. The code ones come first because a rule telling the model to answer from search results is worth nothing while the results omit the evidence.

### What a search returns

- **Return every match in a matched note, not just the first.** `NoteGrep.excerpt` takes `matches[0].index` and discards the rest, so a note matching fourteen times is reported as "14 matches" with the context of one of them. A question spread across many matches in many notes cannot be answered from that, which is turn 3 exactly: the model narrowed a 92-note result to 29 and read none, and no excerpt it was shown carried the answer.

  Per D4: every match, each with a context width the model chooses in lines and the harness caps per match, and overlapping windows merged as `grep -C` does. No per-note cap, because the model is the thing that knows which matches matter.

  This decides answer quality. A prompt rule telling the model to answer from excerpts is worth nothing while the excerpts omit most of the evidence.

- **End a turn that runs out of context by saying so, and offer a way to resume.** Returning every match makes a wide result larger, so an overflow becomes more likely. Today it surfaces as the provider's raw error: `MistralProvider.parseResponse` renders any non-ok response as `API responded 400:` plus a 200-character snippet, and that reaches the user through `notifyFailed` as the turn's failure message. It does not say the cause was context and offers nothing to do next.

  Three parts, per D4. The overflow is recognised and named as itself rather than as an opaque 400. The ending says what the turn had found before it stopped, the way a cancel already names the notes it wrote. And the turn offers a continuation prompt the user can carry into a fresh session, delivered as a copyable block through the path `answer_from_search` already uses.

  The harness writes that text, not the model: an overflow is the model call failing, so there is no reply to ask for. It is built from what the harness holds — the utterance, the paths a search returned, the notes read, and the progress lines already shown.

  A turn-wide token budget is deliberately **out of scope**. It is a new concept here, needs a number tuned against guesses, and would prevent a failure nothing has yet observed. A clear ending and a way to resume is the cheaper half of the same problem and is worth having whether or not a budget ever lands.

### What the model is told

- **A transcription section, telling the model a spoken name is approximate.** A proper noun in an utterance is a guess the transcriber made: it may be a homophone (Jon for John), a mis-split (Jonah's Sea), or a near-miss. The model treats the sound as the signal and the spelling as disposable, and it never re-greps a name it has already failed to find under one spelling.
- **A rule that content already read outranks another search.** A note in the conversation is evidence. Where a read note answers the question, the model answers from it rather than searching for the spelling the user used. This is the rule the failing turn needed at step 5.
- **State the route that answers a question, which today ends nowhere.** `SearchSection` opens by ordering the ways to reach a note: "run a listed command that opens it; glob for its path...; grep for text you expect it to contain; offer what you found with choose_note; open what the user picked." Every route terminates in `choose_note` then `open_note`, which is the route to a note the model is about to **edit**.

  The failing turns asked questions. "What are some favorite things that I've been doing with Jon over the last few months?" has no note to pick and nothing to open: the answer is read out of several notes and summarised. `choose_note` is the wrong move for it, and so is the existing rule "A glob that returned notes has answered the question. Offer what it found with choose_note", which was drafted for the edit path and would send a question down it.

  The tools already support the question path, and `ToolDispatcher.answerFromSearch` needs no bound note: `read_note` each candidate, then `answer_from_search` with the answer and its source paths. The prompt describes that path in one line, in the trailing group, and it names only the last step: "Answer a question about the vault with answer_from_search, listing every note path the answer drew on." Nothing says the step before it is reading the candidates, so a model holding 92 paths and no rule about reading them narrows the pattern instead.

  So the change is a stated route for a question, parallel to the stated route for an edit, ending in reads and an answer rather than a pick and an open. It has to be tool-agnostic: the existing answered-the-question rule is scoped to globs both by its wording and by sitting under the `Globbing:` sub-heading, and the failing calls were greps. The trailing unheaded group in `SearchSection` is where it belongs, beside the line that already says "When a search finds nothing, say so" rather than naming a glob. Per D3 that is where two of the other prompt changes land as well.

  This is the change closest to the observed failure, and the one the transcript argues for most directly.

- **A no-progress guard on empty searches, and a prompt rule announcing it.** `RepeatedRefusalCounter` counts refusals, and an empty search result is a success, so four consecutive nothing-matched searches accumulate no count and the turn runs to its 20-step ceiling or the user's cancel. A run of searches that return nothing is a turn making no progress and ends the same way a repeated refusal does. The model is told this before it happens, in the shape `ModelsRole` already uses for the refusal guard: the rule names the consequence and the alternative, so the ending is predictable and the model has a move other than searching. Per D1 the guard and its announcement are one change; a guard the model is not warned about truncates a turn for a cause it cannot see.
- **Remove the duplicated checkbox line in `DictationSection`.** The sentence beginning "Checking, ticking or marking items done" appears twice, verbatim and adjacent. It is the last two lines of the release 3 fixture, so it shipped. Deleting it changes what the model is told, so the fixture is re-recorded deliberately, and the test's own comment logs each prior re-record in the same shape.

Where the prompt changes go, per D3: the announcement, the read-outranks-search rule and the question route all land in `SearchSection`, which is gated on search being on. The transcription rules split on whether they mention searching, since `DictationSection` is unconditional and reaches a vault that cannot search at all.

## Steps to Replicate

Against a real vault holding a note whose title spells a name the transcriber will mishear, and a model with search enabled.

1. Open no note, so the session is unbound and every turn must search.
2. Say a question about a person whose name is a homophone, so the transcriber writes the wrong spelling: "Did I enjoy my catch up with Jon yesterday?" where the vault spells her John.
3. Watch the model resolve the date, glob the week folder, and read the right note.
4. Observe that it then greps for the transcribed spelling rather than answering from the note it just read, and keeps grepping until the step ceiling or a cancel.

The note read at step 3 contains the answer, which is what makes this a prompt defect rather than a missing capability.

## References

### Task

- `src/model/prompt/system-prompt-sections/dictation-section.ts` - holds the duplicated line, and is where the transcription rules belong, since it already owns how spoken input is treated. Unconditional, so per D3 only the half of those rules that makes sense without a search tool can live here
- `src/model/prompt/system-prompt-sections/search-section.ts` - open first: three of the four prompt changes land here per D3. Holds the route order that ends in `choose_note`, the `Globbing:` block whose sub-heading scopes the answered-the-question rule to one tool, and the trailing unheaded lines that already span both search tools, which is where the new rules go
- `src/model/prompt/system-prompt-sections/models-role.ts` - holds the refusal-guard announcement the empty-search one is modelled on ("A refusal is not a retry prompt..."). Read it for the shape, not the location: it is unconditional, and per D3 the empty-search announcement goes in `SearchSection` instead, because a vault with search off has no search tool to be warned about
- `src/engine/turn/spending/repeated-refusal-counter.ts` - the counter the empty-search guard is modelled on, and the reason an empty result counts for nothing today
- `src/search/note-grep.ts` and `src/search/note-excerpt.ts` - the other half of the work, and the larger half: `excerpt` at line 92 takes `matches[0].index` and drops the rest, `NoteExcerpt.around` is the fixed 200-character window, and `MAX_HITS`/`MAX_PATHS` are the caps the design revisits
- `src/search/models/search-hit.ts` and `src/search/models/grep-result.ts` - what a hit carries today, one excerpt and a match count; returning every match changes this shape, and `wasTrimmed` is the precedent for reporting what a cap dropped
- `src/search/search-report.ts` - where a search that matched nothing is decided, at `result.total === 0`, which is the structured fact the guard counts rather than a matched result string; also where the trim line is written, which is the precedent for any message reporting what a result left out
- `src/engine/tools/tool-schemas.ts` - the `grep_notes` schema the context argument joins, beside the existing `paths_only` and `sort` arguments
- `src/model/providers/mistral-provider.ts` - `parseResponse` is where a non-ok response becomes `API responded 400:` plus a snippet, so it is where a context overflow has to be told apart from a bad key or a rate limit
- `src/engine/turn-ending-service.ts` and `src/engine/turn/ending/turn-ending-kind.ts` - the five endings a turn has today and the two that write to history; an overflow ending joins them, and `endTurnAsCancelled` is the shape to follow since it already reports what the turn had done
- `src/session/views/HistoryEntry.tsx` - the copyable block with its clipboard button, which the continuation prompt reuses rather than reinventing
- `src/engine/turn/conversation-turn-runner.ts` - where `isStuck` ends a turn, so where an empty-search ending hangs off
- `src/model/prompt/tests/fixtures/release-3-prompt.txt` - the byte-for-byte fixture that any prompt edit re-records

### Architecture

- [docs/architecture/5-asking-the-model.md](../../../architecture/5-asking-the-model.md) - what one model call is made of and the order the messages go in, before moving any prompt text
- [docs/architecture/4-the-turn.md](../../../architecture/4-the-turn.md) - the agent loop and how a turn ends, for where a new ending kind fits
