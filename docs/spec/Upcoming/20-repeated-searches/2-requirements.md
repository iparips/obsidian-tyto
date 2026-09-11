---
created: 2026-09-09
updated: 2026-09-09
---

# Requirements

A turn that repeats a search it has already run stops, rather than spending the
whole budget on it.

## Motivation

The reported turn ran the same glob thirteen times and died at the step limit
without editing anything. The user watched twenty-one steps produce nothing, and
was told to try a smaller instruction. The instruction was fine.

A refusal loop is already caught. RepeatedRefusalCounter (Engine Turn) stops a
turn refused twice for the same reason. A search that matches nothing is not a
refusal, so nothing counts it, and the only backstop is the twenty-step budget.

This is the second failure on the same utterance. The first,
[19-relative-dates](../../19-relative-dates/1-index.md), was a wrong date. That fix
shipped, and the dates here are sound: the model wanted 09-05 then 09-06, both
correct readings of "last week's Saturday". What it could not do was notice it
had already asked.

## In Scope

- Count a search that returns nothing the way a refusal is counted, so the same
  fruitless pattern twice ends the turn.
- Tell the model, in the result text, that a pattern it has already run returned
  nothing, so the second call carries its own evidence.
- Leave the twenty-step budget as the outer bound rather than the first line of
  defence.

## Steps to Replicate

On Wednesday 2026-09-09, bound to 1 - Journal/Weekly/Week-37/09-09-Wed.md, with
search enabled: say "Find a note from last week's Saturday and on top write that
it was a great day", and watch the steps list.

## What happened

Twenty-one steps, no edit, and the turn ended on the step limit.

- Step 2 globbed `**/*30*Sat*.md` and returned one note.
- Steps 3 to 5 globbed three date spellings, all matching nothing.
- Step 6 listed Week-36 and returned ten notes, which named the format.
- Step 8 globbed `**/Week-36/09-06-Sun.md` and returned one note.
- Steps 9 to 21 globbed `**/Week-36/09-06-Sat.md`, thirteen times, byte for
  byte identical, every one matching nothing.

## The fault

A fruitless search is invisible to the loop.

SearchToolsService (Engine Tools) returns a TextResult for a glob that matched
nothing: an empty report is a successful call finding zero notes, not a refused
one. ToolCallOutcome.of carries no refusal, so RepeatedRefusalCounter.record is
passed null and resets its count.

The counter does what it was built to do. Its subject is refusals, and this turn
was never refused. The gap is that a repeated fruitless search has the same
shape as a refusal loop - identical call, identical answer, no progress - and is
not counted like one.

The prompt rule from 19-relative-dates already tells the model that nothing
matched means the pattern was wrong, and to widen rather than retry. It was
ignored thirteen times. A rule the model can ignore is not a stop condition.

## Test Scenarios

Setup shared by every scenario:

- Search enabled.
- A vault where the pattern under test matches nothing.

### The same fruitless search twice ends the turn

```gherkin
Given a glob has returned nothing for a pattern
When  the model globs the same pattern again
Then  the turn ends
And   the reply names the pattern that was repeated
```

### A repeated search says it has already been run

```gherkin
Given a glob has returned nothing for a pattern
When  the model globs the same pattern again
Then  the result text says that pattern was already run and found nothing
```

### A search that finds something does not end the turn

```gherkin
Given a glob has returned at least one note
When  the model globs that same pattern again
Then  the turn continues
```

### A different fruitless pattern does not end the turn

```gherkin
Given a glob has returned nothing for one pattern
When  the model globs a different pattern that also returns nothing
Then  the turn continues
```

## Questions

- Does a fruitless grep count towards the same limit as a fruitless glob? The
  design assumes one counter keyed on tool plus pattern, so an identical repeat
  of either counts, but a glob and a grep for the same idea do not combine.
- Is two the right limit, matching RepeatedRefusalCounter, or is three kinder to
  a model narrowing a search? Two would have saved this turn at step 10.

## References

### Task

- src/engine/tools/search-tools-service.ts - open first; where a fruitless glob becomes a TextResult rather than anything the loop counts
- src/engine/turn/repeated-refusal-counter.ts - the existing loop guard, and the shape a search guard should match
- src/engine/tools/tool-call-outcome.ts - the three factories a tool result travels in, and the refusal field the loop reads
- src/engine/turn/conversation-turn-runner.ts - where isStuck ends the turn, and where a search guard would have to be checked

### Project

- [19-relative-dates](../../19-relative-dates/1-index.md) - the previous failure on this utterance, whose prompt rule this turn ignored
