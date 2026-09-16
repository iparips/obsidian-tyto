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
- [3-decisions.md](3-decisions.md) - what is still open: how an anchored edit avoids going stale
- [3-decisions-settled.md](3-decisions-settled.md) - a turn finishing what it started, a batch stopping at its first refusal, and the whole-note guards
- [8-transcripts.md](8-transcripts.md) - the reported session, where note context v4 is the retarget

A running turn now finishes on the note it started, so the session follows the
user and the turn carries out the utterance it was given. Nothing needs telling
the model, which leaves archived spec 33's removal of the history message
standing.

No design or tasks file yet. D6 is the last blocking decision, and it is the
prevention the rest of the spec only contains: the note context is rebuilt per
turn step rather than per tool call, so every anchor in one batch is computed
from the same snapshot and the note moves underneath them.

A whole-note write takes all three guards from D5, which is what makes the
scattered-edit case safe. D6 asks what the anchored tools do once it lands.

Downstream of
[33-reporting-what-a-turn-did](../../3-archived/33-reporting-what-a-turn-did/1-index.md),
which left the batch question open and is where this spec picks it up.
