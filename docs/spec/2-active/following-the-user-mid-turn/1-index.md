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
- [3-decisions.md](3-decisions.md) - what a retargeted turn does, and whether a batch stops at the first refusal
- [8-transcripts.md](8-transcripts.md) - the reported session, where note context v4 is the retarget

No design or tasks file yet. D1 and D3 are both blocking: one decides whether a
retargeted turn ends, defers or continues, the other whether the fix sits in the
executor loop or the anchor check.

Downstream of
[33-reporting-what-a-turn-did](../../3-archived/33-reporting-what-a-turn-did/1-index.md),
which removed the history message this partly restores and left the batch
question open.
