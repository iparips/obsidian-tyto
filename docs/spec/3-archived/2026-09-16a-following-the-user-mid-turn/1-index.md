---
created: 2026-09-16
updated: 2026-09-16
---

# Following The User Mid-Turn: Spec

A turn archiving the todo list was redirected to the shopping list halfway
through, because the user opened that note while it ran. The turn carried on
against the new note and the model was told nothing, so the three turns after it
were spent working out what had happened.

Following the user is the rule and stays. Four changes come out of it: the
running turn keeps the note it began on, one edit per step is enforced, a
whole-note write makes that affordable, and a batch stops at its first refusal.

- [2-requirements.md](2-requirements.md) - the four changes: the turn keeps its note, one edit per step, a whole-note write, a batch backstop
- [3-decisions.md](3-decisions.md) - the turn the user moved under, and why the model needs no telling
- [3-decisions-editing.md](3-decisions-editing.md) - the whole-note write, one edit per step, and the guards each carries
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - four checks, and the one that says whether the model picks the right tool
- [5-design.md](5-design.md) - what goes, what the boundary costs, and the three guards in order
- [6-unit-tests.md](6-unit-tests.md) - the unit tests each changed method needs
- [7-analysis.md](7-analysis.md) - how the session reached the state it did, and the table of drifting anchors
- The reported session's transcript - removed: held personal vault content
- [9-tasks.md](9-tasks.md) - four commits, the middle two landing together

A running turn now finishes on the note it started, so the session follows the
user while the turn carries out the utterance it was given.

Every decision is settled and the design is written. One edit per step is
enforced, so an anchor is always computed from the read that preceded it, which
is the pairing a batch quietly broke. A whole-note write is what makes that
affordable: a scattered edit costs one call rather than twelve steps, and it
carries all three guards D5 named.

Downstream of
[reporting-what-a-turn-did](../../3-archived/2026-09-16e-reporting-what-a-turn-did/1-index.md),
which left the batch question open and is where this spec picks it up.
