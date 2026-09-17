---
created: 2026-09-11
updated: 2026-09-11
---

# Design

A tool computes the date the model would otherwise guess, and the glob rules
make it the only source of a relative date.

## Goal

Move relative date arithmetic out of the model and into the harness, so a wrong
date stops being a way to lose a turn.

## Why a tool rather than more prompt

Two rounds of prompt have already failed. The week anchor told the model today's
date, its ISO week and the Monday that week began, and the reported turn still
resolved "last Friday" to a Thursday six days out.

A prompt makes a correct answer cheaper to reach. A tool makes the wrong one
unreachable, in the same way glob_notes made an invented filename unreachable:
the model asks, the harness answers, and the answer is a fact rather than a
recollection.

## Why a parser rather than a calculator

The tool takes the user's words and returns a date. It does not take a
decomposed anchor and offset for the harness to add up.

Both designs move the arithmetic out of the model. Only the parser also moves
the interpretation. A calculator still needs someone to decide that "last
Friday" means a Friday shifted back one week, and that decision is the one the
model has already got wrong twice. Handing it a smaller version of the same
judgement is not a fix.

chrono-node does the interpretation, and it agrees with ordinary usage on every
phrase from the reported turns. What it cannot read, it declines to read, so a
phrase it does not know refuses rather than resolving to something plausible.

## Out of scope

- Times of day. chrono reads them, and the tool discards them: a vault of daily
  notes has no use for an hour.
- Date ranges, and one call resolving to more than one date. Raised as a
  question in the requirements.
- Moving Today onto date-fns. Its hand-rolled week logic is correct and
  shipped, so replacing it is worth doing on its own rather than inside this.
- Teaching the parser new phrases. A phrase it refuses reaches the user as a
  question, which is the right outcome for a phrase nobody anticipated.
- Returning the vault's filename for a date. The tool would have to guess the
  format that a glob observes, which is the fault it exists to remove.
- Stopping a turn that globs the same pattern repeatedly. That is
  [20-repeated-searches](../../1-upcoming/20-repeated-searches/1-index.md).

## Where the detail lives

- [3a-interface.md](3a-interface.md) - the single argument, what it answers, what it refuses, and the two libraries
- [3b-wiring.md](3b-wiring.md) - the classes, the dispatch, and the one prompt rule
- [3c-test-plan.md](3c-test-plan.md) - the unit cases, per class

## References

- [2-requirements.md](2-requirements.md) - the reported turn, step by step, and what a correct one does
- src/model/today.ts - the instant the resolver uses as chrono's reference date
- src/engine/tools/search-tools-service.ts - the shape DateToolService copies
- src/engine/tools/tool-schemas.ts - TOOL_SCHEMAS and ToolCatalogue.isOffered
- src/model/prompt/system-prompt-sections/search-section.ts - the Globbing bullets
