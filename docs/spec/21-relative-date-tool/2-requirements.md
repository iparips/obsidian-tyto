---
created: 2026-09-11
updated: 2026-09-11
---

# Requirements

A relative date in an utterance becomes an ISO date the harness computed, so the
model never does calendar arithmetic.

## Motivation

Two prompt fixes have now failed on the same fault.
[19-relative-dates](../19-relative-dates/1-index.md) gave the model today's
date, its ISO week and the Monday that week began, then told it to resolve
relative dates against them. The run below still got every date wrong.

Telling a model a calendar is not the same as giving it one. Arithmetic across a
week boundary is the kind of work a harness does exactly and a model does
approximately, and the date it picks then decides every glob that follows. A
wrong date costs the whole turn, because nothing downstream can tell a wrong
date from a missing note.

The vault already exposes deterministic work as tools: glob, grep, read. Date
arithmetic is the same shape of job and has no tool.

## In Scope

- resolve_date (new), a tool taking the date phrase in the user's own words and
  returning the ISO date, the weekday and the ISO week it falls in.
- The tool computes from the same instant Today (Model) holds, so the date line
  and the tool can never disagree.
- A phrase that parses to no date, to more than one, or to a month with no day
  is a refusal naming what it needs, not a guess.
- The parsing comes from chrono-node and the week reporting from date-fns, two
  new runtime dependencies. Neither the phrase list nor the calendar is
  hand-rolled.
- The search rules require the tool before any glob whose pattern carries a date
  the user gave relatively. Spelling out a date the tool did not return is the
  same error as spelling out one no listing showed.
- The tool is offered whenever search is on, and is absent from a vault with
  search off, so the release 3 tool list is unchanged.
- A resolve is a turn step, and the answer echoes the phrase, so the panel
  shows both what was asked and the date the turn worked from.
- Where a phrase has two ordinary readings, the parser's reading stands. On a
  Saturday, "last Friday" is the Friday just gone.

## Steps to Replicate

On Friday 2026-09-11, bound to 1 - Journal/Weekly/Week-37/todo.md, with search
enabled and the vault holding 1 - Journal/Weekly/Week-36/09-04-Fri.md:

- Say "Find a daily note from last Friday and write, I ate eggs on toast on top
  of the note."
- Watch the steps list.

Last Friday is 2026-09-04, in week 36.

## What happened

The turn spent all twenty steps, refused on the twenty-first and edited nothing.

- Steps 2 to 12 globbed for 04-09, 09-05, 04-04 and 09-10, in eleven calls.
- Steps 13 to 19 globbed 09-10-Fri.md seven times, matching nothing each time.
- Step 20 listed the Week-37 folder and returned ten notes.
- Step 21 tried to open 09-11-Fri.md, which no search had returned, and was
  refused.

Not one call named 09-04, the date the user asked for. The model reached for
09-10, which is a Thursday, and for 09-11, which is today rather than last
Friday. It was wrong about the week and wrong about the weekday, with the week
anchor in the prompt telling it both.

## Two faults, one of them already specified

The repeated globbing is the fault
[20-repeated-searches](../Upcoming/20-repeated-searches/1-index.md) specifies,
and it is what turned a wrong date into a spent turn. It is not respecified
here.

This spec covers the other one: the date was wrong from step 2, and no stop
condition makes a wrong date right. A turn that stops repeating still fails,
quietly and in fewer steps.

## What a correct turn does

- Calls resolve_date with "last Friday" and reads back 2026-09-04, a Friday, in
  week 36.
- Globs once for that date, and finds 09-04-Fri.md.
- Offers it with choose_note.
- Opens what the user picked, and writes the sentence at the top.

## Test Scenarios

Setup shared by every scenario:

- Today is Friday 2026-09-11, and search is enabled.
- The vault holds 1 - Journal/Weekly/Week-36/09-04-Fri.md.

### A spoken phrase resolves to the date it names

```gherkin
Given the model calls resolve_date with "last Friday"
When  the harness answers
Then  the answer states 2026-09-04, Friday, week 36
And   it echoes the phrase it resolved
```

### A relative weekday reaches the note it names

```gherkin
Given the user asks for a note from last Friday
When  the turn runs
Then  the note offered is 1 - Journal/Weekly/Week-36/09-04-Fri.md
And   no glob names a date resolve_date did not return
```

### The weekend reading follows ordinary usage

```gherkin
Given today is Saturday 2026-09-12
When  the model calls resolve_date with "last Friday"
Then  the answer states 2026-09-11, the Friday just gone
```

### A phrase naming no single day refuses rather than guessing

```gherkin
Given the model calls resolve_date with "Friday or Saturday"
When  the harness answers
Then  it refuses, naming both dates it found
And   it returns no date
```

### A vault with search off is unchanged

```gherkin
Given search is turned off in settings
When  the tool list is built
Then  resolve_date is absent from it
```

## Questions

- Are two runtime dependencies acceptable, the first since react? Together they
  bundle to about 65 KB in a plugin that ships one main.js. The alternative is
  hand-rolling a phrase list, which is the design this replaced: it refuses
  whatever it failed to anticipate, and every reported failure was a phrase
  nobody anticipated.
- Should the tool resolve a range? "From last Friday to Monday" parses as one
  date today. The design resolves one date, since every reported failure asked
  for one, and a range is additive later.
- Does it return the vault's filename for that date, or only the date? Returning
  a name would close the loop in one call, but it would guess the vault's format
  where a glob observes it. The design returns the date only.

## References

### Task

- [src/model/today.ts](../../../src/model/today.ts) - open first; the calendar the tool computes from, already holding ISO week logic
- [src/engine/tools/tool-schemas.ts](../../../src/engine/tools/tool-schemas.ts) - the schema list and ToolCatalogue, which decides what a vault is offered
- [src/model/prompt/system-prompt-sections/search-section.ts](../../../src/model/prompt/system-prompt-sections/search-section.ts) - the glob rules that must name the tool
- [19-relative-dates](../19-relative-dates/1-index.md) - the prompt-only fix this replaces, and the run that motivated it

### Project

- [20-repeated-searches](../Upcoming/20-repeated-searches/1-index.md) - the sibling fault in the same turn, specified separately
