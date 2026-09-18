---
created: 2026-09-18
updated: 2026-09-18
---

# Searching For A Misheard Name: Unit Tests

The plan for [design-searching-for-a-misheard-name/1-index.md](design-searching-for-a-misheard-name/1-index.md). Whether the model stops looping is a judgement no unit test makes, so the behaviour checks are in [4-acceptance-criteria.md](4-acceptance-criteria.md) and this file asserts only what the code can be held to: the excerpts a grep returns, what the report renders, that the prompt carries the text, and that each new ending is the kind it says it is.

Two facts shape the plan. search-report.test.ts covers ofGlob only, so every grep rendering case below is a new test rather than an edit. And FakeVault (Test Support) needs nothing added: a multi-line note goes through withNote as it is.

## NoteExcerpts

### buildExcerpts

```text
lines = content.split by newline
windows = matches.map -> line of match.index, widened by contextLines each side, clamped to the note
merged = fold windows left to right, joining any that touch or overlap and summing their counts
return merged.map -> NoteExcerpt(startLine, endLine, joined lines, matchCount)
```

```text
one match in the note
  returns one excerpt holding the matching line and the context either side
  names the line range it cut
  counts the one match
two matches far apart
  returns one excerpt per match
  gives each its own line range
two matches whose windows overlap
  returns a single excerpt spanning both
  sums the two counts onto the merged excerpt
  holds the text between them once
two matches whose windows touch but do not overlap
  merges them, since grep -C joins adjacent windows
a match on the first line
  clamps the window to the start rather than reading before it
a match on the last line
  clamps the window to the end
context of zero lines
  returns the matching lines alone
every match in a note matching fourteen times
  returns an excerpt for each unmerged run, so none is discarded
```

## NoteGrep

### find

Existing cases stay: the paths returned, the case-insensitive match, the count per note, the sorting and the two narrowings. Two of them change shape rather than meaning, and the rest are untouched.

```text
a note matching once, excerpts wanted
  returns one excerpt on the hit, replacing the single excerpt string
a note matching fourteen times
  returns every match rather than the first
  leaves the score at fourteen, so the count and the evidence agree
the model asked for a context width
  cuts each window to the width it asked for
the model asked for more than the ceiling
  cuts to fifteen lines rather than refusing the call
the model asked for no width
  cuts to the default of three
paths only
  returns no excerpts at all
more notes match than the hit cap
  returns six hits rather than ten
  reports the uncapped total beside them
paths only, more notes than the path cap
  returns fifty, since a paths row is unchanged
```

## GrepRequest

### getContextLines

```text
null context lines
  answers the default of three
a width inside the range
  answers the width asked for
a width above the ceiling
  answers fifteen
a negative width
  answers zero rather than a negative window
```

## SearchReport

### ofGrep

```text
if result.readNothing -> the narrowing matched none message
if result.total is 0 -> no notes contain the pattern
rows = paths only ? hit paths : hit blocks
a hit block = header line of path and match count, then one line per excerpt naming its range
append trimmedLine where the cap bit
```

```text
the narrowing admitted no note
  says the narrowing matched none, not that the text is absent
nothing matched the pattern
  names the pattern that matched nothing
one note matched once
  writes the path and the match count on their own line
  writes the excerpt beneath it with its line range
one note matched several times
  writes one line per excerpt under the one path header
  names each excerpt's own match count
several notes matched
  writes one block per note
the cap trimmed the result
  says how many notes it showed of the total
paths only
  writes the paths alone, with no header line and no ranges
```

## EmptySearchCounter

### record

```text
undefined leaves the count alone, since the call was not a search
false restarts the count at zero
true increments it
```

```text
a search that found nothing, once
  is not stuck
two searches in a row that found nothing
  is stuck
two that found nothing either side of one that matched
  is not stuck, since a match clears the count
two that found nothing either side of an edit
  is stuck, since a call that is not a search leaves the count alone
no search at all
  is not stuck
```

### message

```text
two empty searches
  names the searches that found nothing rather than a count alone
```

## SearchToolsService

### grep

```text
outcome = noteGrep.find(request, order)
if failed -> Refusal
record the hit paths against pathsReturnedByVault
return TextResult(report, progress line, foundNothing: result.total === 0)
```

```text
the grep matched notes
  returns the report as the result text
  marks the result as having found something
  records the matched paths against the turn
the grep matched nothing
  marks the result as having found nothing
  records no path against the turn
the narrowing admitted no note
  marks the result as having found nothing
the pattern would not compile
  refuses, and marks nothing either way
```

### glob

```text
the glob matched notes
  marks the result as having found something
the glob matched nothing
  marks the result as having found nothing
```

## ConversationTurnRunner

### run

Asserted through EditEngine (Engine) as the existing endings test does, reading the kinds off TranscriptRepository (Session Transcript). The five existing cases are untouched.

```text
two searches in a row find nothing
  records the ending as found-nothing, not as exhausted
  ends the turn rather than running to the step ceiling
a search finds nothing then one matches
  keeps going, and ends on whatever the turn does next
the model call overflows the context
  records the ending as overflowed, not as failed
the model call fails for another reason
  still records the ending as failed
```

## TurnEndingService

### endTurnAsOverflowed

```text
appends a model message saying the turn ran out of context and what it had read
publishes the continuation prompt through publishModelAnswerFn, with the notes read as its sources
returns EndedTurn of Overflowed
```

```text
the turn had read notes
  names those notes in the history message
  publishes a continuation prompt carrying them as its sources
the turn had read nothing
  says so rather than naming an empty list
  still publishes a continuation prompt, since the utterance alone is worth resuming from
```

## ContinuationPrompt

### buildFrom

```text
the turn read notes
  carries the utterance, so a fresh session is not re-asked what was wanted
  carries the paths read as its sources
the turn read nothing
  carries the utterance alone
```

## ContextOverflow

### isOverflow

```text
a response naming the context length
  is an overflow
a response with an ordinary bad-request body
  is not
an unauthorised response
  is not, so a bad key still reads as a bad key
a rate-limit response
  is not
an empty body
  is not, rather than guessing from the status alone
```

## MistralProvider

### parseResponse

```text
an ok response
  returns the parsed body, unchanged
a non-ok response the recogniser names an overflow
  fails with the overflow sentinel rather than the status and a snippet
a non-ok response the recogniser does not
  fails with the status and the 200-character snippet, unchanged
```

## SystemPrompt

### build

Asserted on the assembled prompt, as the existing tests are: search-on cases through the search-enabled group, the transcription rule through the default one.

```text
search enabled
  states that a note already read outranks another search
  states the route that answers a question, naming reading the candidates before answering
  warns that two searches finding nothing end the turn
  names what to do instead of searching again
  still states the existing order to reach a note
  still states that a search never changes the edited note
search disabled
  states that a spoken proper noun is the transcriber's guess
  states the checkbox rule once rather than twice
  says nothing about searching, globbing, grepping or choosing a note
  produces the re-recorded release 3 prompt byte for byte
```

The last two are the review surface, per D3. The third-last is what catches a gated rule leaking into the ungated path, and it is worth asserting as its own test rather than leaving it to the fixture: a fixture diff says something moved, and this says what.
