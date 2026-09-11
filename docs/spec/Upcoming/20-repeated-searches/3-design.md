---
created: 2026-09-09
updated: 2026-09-09
---

# Design

A searched-patterns repository per turn, and a fruitless repeat that ends the
turn the way a repeated refusal does.

## Goal

Stop a turn that is asking the same question twice, without stopping one that is
narrowing a search legitimately.

## Where the guard goes

The turn already has the shape this needs. RepeatedRefusalCounter (Engine Turn)
lives in TurnSpend, ConversationTurnRunner checks isStuck after every batch of
tool calls, and TurnOutcomes.stuck ends the turn with the reason. A search guard
reuses all of it rather than adding a second way for a turn to stop.

What it cannot reuse is the counter itself. That one counts consecutive repeats
of one reason; this needs to remember every fruitless pattern the turn has run,
because the model interleaved a successful glob at step 8 between the identical
ones at 7 and 9. A consecutive counter resets on that and never fires.

## FruitlessSearchRepository

A turn-scoped repository, built in TurnRepository beside notesChosenByUser, so
what a turn learned about a pattern dies with the turn.

- `record(tool, pattern)` notes that a call returned nothing
- `hasRun(tool, pattern)` says whether this turn already ran it and got nothing
- The key is tool plus pattern, so a glob and a grep for the same string are two
  keys: they are different questions, and one may find what the other missed

A Set of joined keys is enough. Nothing needs the count, only whether the pair
has been seen, because the second identical call is the one that ends the turn.

## A fruitless repeat is a refusal

SearchToolsService (Engine Tools) gains the check. It already holds the result
before returning it, so it knows the call found nothing.

- A search returning nothing that has not been run: record it, return the report
  unchanged.
- A search returning nothing that has been run: return a Refusal naming the
  pattern.

Refusal is what makes the rest work. It travels as ToolCallOutcome.refused, so
RepeatedRefusalCounter records the reason and the existing loop guard reads it.
The reason text is the same for both calls of a repeated pair, so a third
identical call is not needed to trip isStuck: the first repeat refuses, and the
counter is at one. A fourth identical pattern would trip it, but the turn should
not get that far.

That leaves one gap the design accepts: a single repeat refuses and tells the
model, but does not itself end the turn. Two distinct patterns each repeated
once will. Ending on the first repeat would need its own outcome rather than
riding on the refusal counter, and the reported turn had thirteen repeats of one
pattern, which the refusal path stops at the second.

## What the model reads

The refusal text says what happened, so the model has evidence rather than a
rule to remember.

```text
you already globbed **/Week-36/09-06-Sat.md this turn and it matched nothing;
widen the pattern or use a path a listing returned
```

The wording follows loadSkill's existing refusal for a skill loaded twice, which
names what was repeated and what to do instead.

## Test plan

SearchToolsService and the repository are both pure given a fake vault, so every
case runs without a model.

- The repository reports a pattern unseen before it is recorded
- The repository separates a glob and a grep carrying the same pattern
- A first fruitless glob returns the empty report rather than a refusal
- A second identical fruitless glob returns a refusal naming the pattern
- A glob that found notes is not recorded, so repeating it is not refused
- A second fruitless glob with a different pattern is not refused
- A fruitless grep repeated is refused the same way
- The refusal reaches RepeatedRefusalCounter, so two distinct repeats end the turn

The end-to-end case, that the reported utterance now edits a note, is a model
outcome and belongs in docs/manual-tests.

## Out of scope

- Ending the turn on the first repeat. It needs an outcome of its own, and the
  refusal path already stops the reported failure.
- The twenty-step budget. It stays as the outer bound.
- Whether the model should have globbed 09-06-Sat at all. The date was 09-05,
  and a wrong first guess is allowed; asking twice is what this stops.
- Caching a successful search. Repeating one wastes a step but returns notes,
  which is progress rather than a loop.

## References

- [2-requirements.md](2-requirements.md) - the reported turn step by step, and the four scenarios
- src/engine/tools/search-tools-service.ts - where the check goes, and the two returns it chooses between
- src/engine/turn/turn-repository.ts - where the repository is built, beside the other turn-scoped state
- src/engine/tools/harness-result.ts - Refusal, and what it carries back to the loop
