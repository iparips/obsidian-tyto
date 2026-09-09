---
created: 2026-09-09
updated: 2026-09-09
---

# Design

Today gains a week anchor, and two glob rules change from budgets into stop
conditions.

## Goal

Remove the calendar arithmetic from the model, and stop a turn that has already
found its note from searching past it.

## The week anchor

Today (Model) owns the calendar, so the anchor is computed there rather than
assembled in the prompt. It gains the ISO week number and the date that week
began, both from the instant it already holds.

`describe` keeps its shape for the callers wanting the plain date.
`describeWithWeek` carries the anchor, and DateMessage (Model Prompt) reads it
in place of the old call.

ISO weeks start on Monday, and the number is the one the vault's folders use.
Both facts are computed, never asked of the model.

The line becomes:

```text
Today is 2026-09-09 (Wednesday), in week 37, which began Monday 2026-09-07.
```

The instruction under it is unchanged: resolve relative dates against this,
never against a note name.

The anchor is not sufficient on its own. The reported turn stated a correct week
window in prose and still concluded a wrong date, so an anchor makes the right
answer cheaper to reach without making the wrong one unreachable. The two rule
changes below are the backstop, and either would have saved the turn alone.

## A glob that found notes stops the search

The rule reads as a cap on how many globs are allowed. Rewritten as a stop
condition, it tells a model holding a note what to do with it.

- Was: two globs that returned notes are enough, read them rather than globbing
  again.
- Now: a glob that returned notes has answered the question, offer what it found
  with choose_note rather than searching for a name you expected to see.

The change is the object of the sentence. The old rule counts calls; the new one
names the state that ends the search.

## A listing fixes the naming convention

The rules already forbid spelling out an unseen date. That bullet gains a second
clause covering the case the reported turn hit: the model had seen the format
and ignored it.

- Now, appended: once a glob has returned notes, their names are the vault's
  format. A later glob matches that format or it is wrong.

Steps 5 and 6 spelled out day-month order after step 4 returned month-day. The
clause makes that a stated error rather than an unstated one.

## What does not change

- The bullet forbidding a question about which week a date falls in. It already
  covers the reply that was given.
- The bullet requiring a single candidate be offered. Also already correct.

Both rules were broken by the reported turn, and neither is the reason it broke:
a model that stops at step 4 never reaches them. Restating them would add prompt
length without changing the failure.

## Test plan

Today, DateMessage and SearchSection are all pure, so every case below runs
without a model.

- Today emits the ISO week number for a date mid-week
- Today emits the Monday the current week began
- Today rolls to the previous week's number on a Sunday, since ISO weeks end there
- Today handles a January date whose ISO week belongs to the previous year
- `describe` is unchanged, so existing callers are untouched
- The date line carries the week number and week start
- The resolve-against-today instruction is unchanged
- The glob rules name choose_note as what follows a glob that returned notes
- The glob rules carry the clause holding a later glob to a seen format

The end-to-end behaviour, that "Saturday last week" reaches the Week-36 note, is
a model outcome. It belongs in the manual tests under docs/manual-tests, not in
the suite.

## Out of scope

- Weekday-first globbing for relative-day requests. It works only where a vault
  names weekdays in its files, and the anchor is the general fix. Raised as a
  question in the requirements.
- The timezone question. Today already uses local date getters, so the date it
  emits matches the user's calendar. A session running across local midnight
  sends two different dates, which is real and unrelated to this failure.
- The pre-flight resolve failure seen in the other run of this utterance. A
  session bound to a note with no editor refuses the turn before the model is
  asked anything, which is its own fault with its own fix.

## References

- [2-requirements.md](2-requirements.md) - the reported turn, step by step, and what a correct one does
- src/model/today.ts - `describe`, which the anchor joins
- src/model/prompt/date-message.ts - the only caller that changes
- src/model/prompt/system-prompt-sections/search-section.ts - the unseen-date rule and the glob budget

Paths are as built. The spec was written against src/engine/prompting, which
moved to src/model before this shipped.
