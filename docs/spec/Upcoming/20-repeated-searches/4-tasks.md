---
created: 2026-09-09
updated: 2026-09-09
---

# Tasks

Two commits. The first is inert on its own; the second turns it on.

## Commit 1: a turn remembers its fruitless searches

FruitlessSearchRepository, built in TurnRepository beside notesChosenByUser so
it dies with the turn.

- `record(tool, pattern)` and `hasRun(tool, pattern)`, over a Set of joined keys
- Nothing calls it yet, so the suite stays green

Tests cover an unseen pattern, a recorded one, and a glob and grep carrying the
same pattern staying separate.

## Commit 2: a repeated fruitless search is refused

SearchToolsService reads the repository before returning an empty report.

- A search finding nothing that has not been run records and returns as now
- A search finding nothing that has been run returns Refusal naming the pattern
- A search that found notes is neither recorded nor refused

The refusal travels as ToolCallOutcome.refused, so RepeatedRefusalCounter counts
it and the existing isStuck path ends the turn. No change to
ConversationTurnRunner.

Tests cover the first fruitless call, the repeat, a different pattern, a
successful repeat, and a fruitless grep.

## After the commits

The end-to-end case is a model outcome and belongs in the manual tests: speak
the reported utterance on a Wednesday and confirm the turn either reaches the
Saturday note or stops early, rather than spending twenty steps.
