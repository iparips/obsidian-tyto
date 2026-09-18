---
created: 2026-09-18
updated: 2026-09-18
---

# Design: What A Search Returns

The two code changes the prompt rules depend on, per D4: a grep returns every match in a matched note, and SearchReport renders them as a block. Part of [1-index.md](1-index.md).

## What a hit becomes

A hit keeps its path and its match count and trades one excerpt for a list of them. NoteExcerpt (Search) stops being a 200-character window around one offset and becomes a line-range window around a run of merged matches.

```
SearchHit (Search)        path, score, excerpts: readonly NoteExcerpt[]
NoteExcerpt (Search, new) startLine, endLine, text, matchCount
```

Three properties decide the shape, and each answers a question the old one could not.

- A hit carries several excerpts rather than one string, because the count and the evidence have to agree. A note reported as fourteen matches with one window invites the model to read the window as the note, which is turn 3.
- An excerpt is a line range rather than a character offset. The model asks for context in lines, per D4, so the unit the model names and the unit the harness cuts on are the same one. A character window cannot say it merged two matches three lines apart.
- An excerpt carries its own matchCount, so a merged block says how many matches it holds. Without it, fourteen matches rendering as nine blocks looks like five matches went missing.

NoteExcerpt changes from a cutter to a value. Today it is a class of one static method returning a string; it becomes a value object the cutting produces, and the cutting moves to NoteExcerpts (Search, new), a factory beside it. That split is the code-generation rule that static builders and the values they build are separate classes, and it is what lets a test assert a range without parsing a rendered string.

The old NoteExcerpt.around is deleted rather than kept beside the new path. It has one caller, NoteGrep.excerpt (Search), and that caller is the thing being changed, so there is no unchanged path to preserve.

## The payload arithmetic

The cap I accept is per match, not per note, and the numbers are the reason.

| Case                                   | Today          | New, 3 lines of context | New, 15 lines |
| -------------------------------------- | -------------- | ----------------------- | ------------- |
| One match in one note                  | 200 chars      | ~240 chars              | ~1,200 chars  |
| Fourteen matches in one note, merged   | 200 chars      | ~1,700 chars            | ~8,000 chars  |
| Ten hits, four matches each            | ~2,000 chars   | ~6,800 chars            | ~34,000 chars |
| Ten hits read in full instead          | ~10,000 tokens | not needed              | not needed    |

Ten hits at the default width is roughly 1,700 tokens against today's 500. The workaround it replaces is reading those ten notes in full, which is about 10,000, so the change is cheaper than the behaviour it exists to stop. At the fifteen-line ceiling ten hits reach about 8,500 tokens, which is the worst case a single call can cost and is still under a tenth of a 128k window.

That is the bet: a per-match ceiling bounds one match, MAX_HITS bounds the notes, and nothing bounds the matches within a note because the model is what knows which matter. A note matching two hundred times at fifteen lines is the pathological case, and it is bounded only by the note's own length, since merging collapses a dense run into one block. I accept it because a note matching two hundred times is a note about the subject, and the answer is in it.

## How SearchReport renders a hit

SearchReport.ofGrep (Search) keeps its three branches and changes only what a matched row looks like. A hit stops being one line and becomes a block: a header line naming the path and the count, then its excerpts, each labelled with its line range.

```text
1 - Journal/Weekly/Week-35/09-17-Thu.md (14 matches):
  lines 3-7 (2 matches): ...# Cuddles with Cat
  tagged #reflection/cat/cuddles...
  lines 22-24 (1 match): ...Cat brought the good coffee...
1 - Journal/Weekly/Week-36/09-24-Thu.md (3 matches):
  lines 11-14 (3 matches): ...walked with Cat to the market...
showing the first 2 of 19; narrow the pattern to see the rest
```

Four choices in that shape, each against a failure the transcript shows.

- The path is its own line rather than a prefix, because a hit now spans several lines and a reader scanning for paths would otherwise find them buried mid-block.
- The line range is stated, so the model can ask to read a note at a place rather than in full, and so a merged block is visibly one region rather than two hits collapsed.
- Each excerpt says its own match count, which is what makes a merge legible against the note's total.
- The trimmed line is unchanged, and still counts notes rather than matches. It reports what the cap dropped, and the cap is on notes.

Rendering stays in SearchReport rather than moving onto SearchHit.describe (Search). The hit's describe is deleted: a value object that renders itself was tolerable at one line and is a second renderer at four, and SearchReport already exists to be the one place the model's view is decided. The paths-only branch is untouched.

## What MAX_HITS now means

It means fewer notes for more evidence about each, and I am lowering it from ten to six.

Ten was chosen because a row cost one 200-character excerpt, and the comment in note-grep.ts says exactly that. A row now costs a block, so holding ten would roughly triple the payload of a wide grep while keeping a cap tuned for a cheaper row. Six hits at the default width is about 1,000 tokens, which is nearer today's 500 than ten hits would be, and it is the number that keeps a wide grep costing what a wide grep costs today.

The answer-quality argument runs the same way, which is what D4 turns on. The failing question was answered by many matches across several notes, not by a shallow look at ten. Six notes seen properly beats ten notes seen through one window each, and the trimmed line still tells the model there are more. MAX_PATHS stays at fifty: a paths-only row is a path, and nothing about it changed.

## The context width the model asks for

grep_notes (Engine Tools) gains one optional argument, context_lines, beside paths_only and sort.

- Default three, per D4. Enough to carry a sentence that wrapped and the line either side of it.
- Capped at fifteen per match by the harness, so a model asking for a hundred gets fifteen rather than a refusal. A refusal would cost a step to recover from a request that has a sensible reading.
- Zero is legal and means the matching lines alone.

Windows merge as grep -C does: two matches whose windows touch or overlap become one excerpt spanning both, carrying the sum of their counts. Merging is why the ceiling is per match rather than per note, and it is what stops the text between two near matches being sent twice.

The cap lives on GrepRequest (Search) rather than in NoteGrep (Search), since the request is where the model's arguments are already clamped and validated, and a request that cannot express an out-of-range width cannot pass one on.

