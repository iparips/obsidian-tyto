---
created: 2026-09-18
updated: 2026-09-18
---

# Searching For A Misheard Name: Spec

A voice harness never gets the name the user said, only what the transcriber guessed. One session spelled the same person Kat, Cat and "Catworth Sea" across five turns and never found her, while the answer sat in a note the model had already read and quoted back.

The prompt is most of the cause. It spends thirty lines on how to glob a path the model has not seen and says nothing about a name it cannot trust. Four defects follow: no rule that a spoken name is approximate, no rule that a note already read outranks another search, no stated route for answering a question, and no guard treating a run of fruitless searches as a turn going nowhere. A fifth is unrelated and sits in the same file: `DictationSection` repeats its checkbox sentence verbatim, and the duplicate shipped in release 3.

The sixth is not in the prompt, and it is the one that decides answer quality. `NoteGrep` returns one excerpt per matched note, taken from the first match, and counts the rest without showing them. A note mentioning Cat fourteen times comes back as "14 matches" plus the context of one of them. A question answered by many matches across many notes therefore cannot be answered from a grep at all, which is the third turn in the transcript exactly.

Two consequences worth stating up front. The model was not ignoring what it found: handed 92 paths, it had no rule saying to read them, one rule that did apply to a long result — the trim line's "narrow the pattern to see the rest" — and excerpts that would not have answered the question anyway. And a prompt rule telling it to answer from search results is worth nothing until the results carry the evidence, so D4 lands with the prompt changes rather than after them.

Two readings were ruled out by checking the code and running a reproduction, and the requirements record both so the build does not re-open them. The chat history is well formed across a cancel, and the transcript's habit of rendering a step's tool result at the top of the next step is by design. Neither is a leak, so no engine change is needed for them.

- [0-prompt.md](0-prompt.md) - the block handing the build to a fresh session
- [0-prompt-design.md](0-prompt-design.md) - the block handing the design phase to a fresh session, and the record of what that phase was asked for
- [2-requirements.md](2-requirements.md) - what the transcript shows, the seven changes, and the two things that turned out not to be broken
- [3-decisions.md](3-decisions.md) - what a grep returns for a note with many matches, why an unread result is a different defect from an empty one, where the announcement lives, and why the guard is announced rather than silent
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - six manual checks, since whether a model stops looping is a judgement no unit test makes
- [design-searching-for-a-misheard-name/1-index.md](design-searching-for-a-misheard-name/1-index.md) - the design, split across six files: what a search returns, the two new endings, the prompt rules, the interfaces and the rollout
- [6-unit-tests.md](6-unit-tests.md) - the test plan, one heading per production method the design changes
- [meta/1-index.md](meta/1-index.md) - the context audit: what the design phase read, what each source decided, and what to change

D1 is resolved: the guard ends the turn, and the prompt tells the model it will. The two halves are one change. `ModelsRole` already does this for the other stuck-ending — "A refusal is not a retry prompt. Repeating a call that was just refused ends the turn with nothing written" — so a guard the model is warned about by name is the established pattern here, and an unannounced one would truncate a turn for a cause the model cannot see.

D2 is resolved too: an unproductive search is one that returned nothing, and that alone. A search returning paths the model never read is a different defect with a different fix — the model had no stated route for answering a question, so it took the only move the prompt offered. A counter there would punish a model doing as it was told.

D3 resolves the placement: the announcement goes in `SearchSection`, which is already gated on search being on. Three of the four prompt changes land there — the announcement, the read-outranks-search rule, and the question route — which is right, because the announcement's alternative is the other two. Ending a turn for fruitless searching is only fair once the model has been told what to do instead.

D4 is the largest of the four and the only one touching code outside the prompt and the turn loop. Every match is returned, with a context width the model picks and the harness caps, and overlapping windows merged. There is no per-note cap, because the model is what knows which matches matter.

A turn-wide token budget was considered and left **out of scope**. It is a new concept here, it needs a number tuned against guesses, and it would guard a failure nothing has yet observed. What ships instead is the cheaper half: a turn that runs out of context says that is what happened, names what it had found, and offers a continuation prompt for a fresh session. The harness writes that text, since an overflow is the model call failing and there is no reply to ask for.

The design settles the calls those four left to it, recorded as D5 to D9. A hit becomes a path and a list of line-range excerpts, merged where their windows touch; MAX_HITS drops from ten to six, because a row costs a block rather than a 200-character line. The empty-search fact travels back from the search services as a field rather than being parsed out of a rendered report, which makes the guard four files rather than the one the requirements imply. And the continuation prompt is built from the utterance and the notes read, both turn-scoped, never from the session-scoped paths a search returned.

The fixture is the review surface. The release 3 prompt is a vault with search off, and it contains no occurrence of "search", "glob", "grep" or "choose_note", so all three `SearchSection` changes are invisible to it. What does move it is the duplicated `DictationSection` line, the last two lines of the fixture, and whatever transcription rules land in that unconditional section. A re-recorded fixture mentioning a search tool means a gated rule leaked into the ungated path.

One naming note: the spec folder for the tag tool started the same day and carries no letter, so by the naming rule it should be `2026-09-18a-` and this one `2026-09-18b-`. It is already committed and named in a handover prompt another session is building from, so renaming it would break that session's links. Left alone deliberately rather than overlooked.
