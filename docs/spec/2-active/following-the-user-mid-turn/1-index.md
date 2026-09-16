---
created: 2026-09-16
updated: 2026-09-16
---

# Following The User Mid-Turn: Spec

A turn archiving the todo list was redirected to the shopping list halfway
through, because the user opened that note while it ran. The turn carried on
against the new note and the model was told nothing, so the three turns after it
were spent working out what had happened.

Following the user is the rule and stays. What a running turn does about it, and
what a batch does when one of its anchors goes stale, are what this settles.

- [2-requirements.md](2-requirements.md) - the two defects, and the batch table showing how the anchors drifted
- [3-decisions.md](3-decisions.md) - the turn the user moved under, and why the model needs no telling
- [3-decisions-editing.md](3-decisions-editing.md) - the whole-note write, one edit per step, and the guards each carries
- [8-transcripts.md](8-transcripts.md) - the reported session, where note context v4 is the retarget

A running turn now finishes on the note it started, so the session follows the
user and the turn carries out the utterance it was given. Nothing needs telling
the model, which leaves archived spec 33's removal of the history message
standing.

Every decision is settled, so the design can be written. A scattered edit becomes
one whole-note write carrying all three guards D5 named, and one edit per step is
enforced so a model that reaches for the anchored tools anyway cannot batch them.
That is a rule the model cannot misjudge, where choosing the right tool was the
guess this spec kept paying for.

Downstream of
[33-reporting-what-a-turn-did](../../3-archived/33-reporting-what-a-turn-did/1-index.md),
which left the batch question open and is where this spec picks it up.
