---
created: 2026-09-11
updated: 2026-09-11
---

# Test Plan

RelativeDateResolver takes its instant as a constructor argument, so every case
below fixes a reference date and runs without a model or a clock.

Reference date for the resolver cases is Friday 2026-09-11 unless the case says
otherwise.

RelativeDateResolver

- "last Friday" resolves to 2026-09-04, in week 36
- "Saturday last week" resolves to 2026-09-05, in week 36
- "3 days ago" resolves to 2026-09-08
- "last Friday" from Wednesday 2026-09-09 also resolves to 2026-09-04
- "last Friday" from Saturday 2026-09-12 resolves to 2026-09-11, the Friday
  just gone, which is chrono's reading and this spec's
- A date in the first days of January reports the ISO week of the year that
  week belongs to
- "2026-09-04" passes through as itself, so a phrase already a date needs no
  special case
- The instant given is the reference, so the same phrase with two instants
  gives two dates

Refusals, one per detection route

- "my todo list" and "a while back" parse to nothing, and refuse
- "Friday or Saturday" parses to two results, and the refusal names both
- "September" parses to one result and still refuses: it reports a month and
  no day or weekday, so the count of results cannot catch it and the known
  values must
- "last month" refuses on that same route. chrono reports the month as known
  and implies the day from the reference date, which is the shape a bare month
  has, so no detection route separates the two
- A refusal carries no date

DateToolService

- A resolved phrase returns the sentence, naming phrase, date, weekday and week
- The result carries a turn step naming the phrase and the date
- A refusal from the resolver becomes a Refusal, and the reason reaches the
  model unchanged

ToolCatalogue, in src/engine/tests beside the other harness tool tests

- resolve_date is offered when search is on
- It is absent when search is off

ToolCall

- isHarnessTool is true for resolve_date, so the dispatcher routes it

SearchSection

- The glob rules name resolve_date as what precedes a glob on a spoken date

The end-to-end case is a model outcome: whether the model sends the phrase
rather than a date of its own. It belongs in docs/manual-tests, not in the
suite.
