---
created: 2026-09-11
updated: 2026-09-11
---

# The Tool Interface

What resolve_date takes, what it answers, and which phrases it refuses.

## One argument: the user's own words

resolve_date takes a single string, the date phrase as the user said it.

```text
resolve_date(phrase: "last Friday")
```

No anchor, no offset, no unit. Decomposing the phrase into arguments the
harness adds up only relocates the failure: the model would decide that "last
Friday" means a Friday shifted back one week, which is the judgement it has
already got wrong twice. A parser removes the step instead.

The phrase is passed through close to verbatim. chrono reads a date out of
surrounding prose, so "the beautiful Saturday" resolves, and the model is not
asked to clean the utterance up first.

## What it answers

```text
"last Friday" is 2026-09-04 (Friday), in week 36, which began Monday 2026-08-31.
```

The shape matches the date line DateMessage (Model Prompt) already sends, so
the model reads one format for both. The week and its Monday come along because
the vault's folders are week numbers: without them the model derives a folder
from a date, which is the second arithmetic step the reported turn also got
wrong.

The phrase is echoed back. A resolve the user did not mean is then visible in
the panel rather than silent.

## What it refuses

Three cases, each a refusal naming what it needs rather than a guess.

- Nothing parsed. "my todo list" and "a while back" return no date, and the
  refusal says to ask the user rather than to try a variant.
- More than one date. "Friday or Saturday" parses as two, and a tool that took
  the first would be choosing for the user. The refusal names both and says to
  ask which.
- A month or a year with no day. "September" resolves only to a month, so the
  refusal says the phrase names no single day.

The third case is detected from what chrono says it knew, not from the date it
returned. A phrase resolving through a weekday reports that weekday as known,
where a bare month name reports only a month. The distinction is what separates
a good relative resolve from an underspecified one.

## Where the readings are settled

chrono decides them, and the spec does not relitigate each one.

On a Saturday, "last Friday" resolves to the Friday just gone rather than the
Friday of the previous week. That is the ordinary English reading, and it is
what a person expects. A parser matching usage needs no rule in the prompt
explaining when it does not.

The model is not told to second-guess it. A resolve the user did not mean is
corrected by the user reading the echoed phrase and the date beside it, which
is cheaper than a question on every weekend request.

## Known imprecision

Bounded, and none of it costs a turn:

- "start of last week" and "end of last week" both resolve to the same day.
  The qualifier is dropped rather than misread.
- "a fortnight ago" does not parse, so an Australian phrasing refuses and the
  model asks. Worth watching in the manual tests.
- "last month" refuses rather than resolving. chrono reports the month as known
  and implies the day from the reference date, which is the same shape a bare
  month has, so the underspecified check cannot let one through and stop the
  other. Refusing is the right half of that pair: a month names thirty days,
  and picking one would be the guess this tool exists to remove.
- A phrase naming a time of day resolves to the date and the time is discarded.
  A vault of daily notes has no use for an hour.

## The libraries

chrono-node parses; date-fns reports the week. Both are MIT and neither pulls a
transitive dependency.

| Library     | Bundled, minified | Job                              |
| ----------- | ----------------- | -------------------------------- |
| chrono-node | 45 KB             | phrase to date                   |
| date-fns    | 20 KB             | ISO week, week start, formatting |

Two new runtime dependencies, the first since react, on a plugin that ships one
bundled main.js. The cost buys the parsing this spec exists to get right, and
getISOWeek handles a date whose ISO week belongs to the neighbouring year,
which Today (Model) currently hand-rolls.

Measured on the built plugin, the pair costs 69 KB minified: 495 KB before,
564 KB after. Close enough to the 65 KB estimated above that the trade stands
as argued.
