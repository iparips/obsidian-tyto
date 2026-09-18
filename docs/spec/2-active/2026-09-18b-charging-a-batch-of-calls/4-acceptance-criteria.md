---
created: 2026-09-18
updated: 2026-09-18
---

# Acceptance Criteria

Checks a person runs against a real vault and a real key. The unit suite covers the arithmetic; what it cannot cover is whether a real model, batching as it chooses, now finishes a turn it used to lose.

## AC1: The turn that ran out now answers

In a vault whose recent weeks are archived, ask for themes in tagged notes across three weeks. The turn reaches an answer rather than ending on "ran out of steps".

This is the turn from the requirements. It is the whole reason for the change, and it is the one check that cannot be faked.

## AC2: A turn that batches gets further than one that does not

Watch the steps list on any search-heavy turn. A reply sending several calls advances the count by less than the number of calls it sent.

## AC3: The warning still arrives in time to cancel

On a turn that runs long, the panel gains its "taking longer than usual" line while there is still room to act on a rephrasing, and gains it once.

## AC4: A runaway turn still stops

Ask something that sends the model searching without converging. The turn still ends on the allowance rather than running on, and the steps list shows where it went.

The risk this change carries is a turn that batches its way past twenty calls of real work. This check is what says the allowance still binds.
