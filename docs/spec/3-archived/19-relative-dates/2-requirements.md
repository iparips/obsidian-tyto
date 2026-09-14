---
created: 2026-09-09
updated: 2026-09-09
---

# Requirements

A relative date in an utterance reaches the note the user meant, without the
model computing a calendar.

## Steps to Replicate

On Wednesday 2026-09-09, with the vault holding
1 - Journal/Weekly/Week-36/09-05-Sat.md:

- Open a daily note, so the session binds. The reported run was on the Week-37
  note for that Wednesday.
- Say "find a daily note from Saturday last week and add on top of it a sentence
  that says, this Saturday was beautiful".
- Watch the steps list and the reply.

Saturday last week is 2026-09-05, and the Week-36 note above is it.

## What happened

The turn ran seven steps and ended in a question. It never edited anything.

- Step 4 globbed for 05-09-Sat and returned one note, the correct one.
- Steps 5 and 6 globbed for 30-08-Sat, twice, and matched nothing.
- Step 7 globbed the Week-36 folder and returned ten notes.
- The reply asked which Saturday was meant.

The model computed 2026-08-30 for "Saturday last week". That date is six days
early, and it is a Sunday. It was wrong about the week and wrong about the
weekday.

## The three faults

Each loses the turn without help from the others.

### Arithmetic the model cannot do reliably

Today is the only temporal fact in the prompt. Today (Engine Prompting) emits
the date and weekday, and PromptFactory (Engine Prompting) instructs the model
to resolve every relative date against it. Nothing else anchors the calendar.

The reply proves the model can state a correct week window and still not use it.
It wrote that week 36 covers 2026-08-31 to 2026-09-06, which contains
2026-09-05, then concluded 2026-08-30 anyway.

The vault's folders are ISO week numbers, and the model is never told the
current one. Mapping a date onto Week-36 is a second derivation on a first.

### A found note that did not stop the search

The glob rules cap searching at two calls that returned notes. That is a budget,
not a stop condition, so a model holding the right note reads nothing telling it
to stop.

Step 4 had the answer. Three more globs followed.

### A filename invented against the evidence

The glob rules forbid spelling out a date the model has not seen. Steps 5 and 6
spelled out 30-08-Sat.md, in day-month order, after step 4 had already shown the
vault writes month-day.

The rule exists and nothing enforces it. A listing that returned notes has
revealed the convention, and later globs should be held to it.

The prose question the turn ended on breaks two more rules: asking which week a
date falls in is forbidden outright, and a single candidate must be offered
through choose_note. Neither is the reason the turn broke. A model that stops at
step 4 never reaches them, so both stay as they are.

## What a correct turn does

- Resolves "Saturday last week" to 2026-09-05 without arithmetic of its own.
- Globs once, on the weekday or the date, and finds 09-05-Sat.md.
- Offers that note with choose_note.
- Opens what the user picked, and writes the sentence at the top.

## Test Scenarios

Setup shared by every scenario is the one in Steps to Replicate, with search
enabled.

### The date anchor names the current week

```gherkin
Given a turn is opening
When  the date context is built
Then  it states today as 2026-09-09 (Wednesday)
And   it states the ISO week number and the date that week began
```

### A relative weekday reaches the note it names

```gherkin
Given the user asks for a note from Saturday last week
When  the turn runs
Then  the note offered is 1 - Journal/Weekly/Week-36/09-05-Sat.md
```

### A glob that found notes ends the search

```gherkin
Given a glob has returned at least one note
When  the turn continues
Then  the user is offered that note through choose_note
And   the turn neither globs again nor asks which date was meant
```

## Questions

- Does the week anchor state the ISO week number, the Monday it began, or both?
  The number maps onto a folder; the Monday is what makes "last week"
  subtractable. The design assumes both, at the cost of a longer date line.

## References

### Task

- [src/engine/prompting/today.ts](../../../../src/engine/prompting/today.ts) - open first; the date the model is given, and where the week anchor goes
- [src/engine/prompting/rule-builder.ts](../../../../src/engine/prompting/rule-builder.ts) - the glob, asking and choosing rules, all three of which this turn broke
- [src/engine/prompting/prompt-factory.ts](../../../../src/engine/prompting/prompt-factory.ts) - where the date line is assembled and positioned

### Project

- [10-finding-notes](../10-finding-notes/1-index.md) - the glob rules this narrows, and why globbing before guessing was the original fix
