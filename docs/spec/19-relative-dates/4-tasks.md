---
created: 2026-09-09
updated: 2026-09-09
---

# Tasks

Three commits. Each stands alone, and either of the last two fixes the reported
turn without the others.

## Commit 1: Today carries a week anchor

Today gains the ISO week number and the date the current week began, computed
from the instant it already holds.

- `isoWeek` and `weekBegan`, both private, both from `this.now`
- `describeWithWeek` returns the date, weekday, week number and week start
- `describe` is untouched, so no existing caller moves

Tests cover a mid-week date, a Sunday rolling back a week number, and a January
date whose ISO week belongs to the previous year. Nothing outside Today changes,
so the rest of the suite stays green.

## Commit 2: the date line states the week

`DateMessage` reads `describeWithWeek` instead of `describe`. The instruction
beneath it is unchanged.

- The line names the week number and the Monday it began
- The resolve-against-today sentence stays word for word

The tests asserting the old line change with it.

## Commit 3: the glob rules stop a finished search

Two edits in `SearchSection`, both to existing bullets.

- The two-globs budget becomes a stop condition naming choose_note
- The unseen-date rule gains a clause holding a later glob to a format a
  listing already returned

Prompt text only, so the tests asserting those bullets are the only ones
affected.

## After the commits

The end-to-end case is a model outcome and belongs in the manual tests: speak
"find a daily note from Saturday last week" on a Wednesday and confirm the turn
offers the Saturday note from the previous week's folder rather than asking
which Saturday was meant.
