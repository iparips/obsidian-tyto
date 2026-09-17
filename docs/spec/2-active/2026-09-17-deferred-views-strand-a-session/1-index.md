---
created: 2026-09-17
updated: 2026-09-17
---

# Deferred Views Strand A Session: Spec

A session refuses its second utterance, saying the note is not open in an editor
while the user is looking at that note. Reported from a vault on
mistral-medium-latest, with a transcript covering two turns.

The cause is Obsidian 1.7.2's deferred views. A background leaf holds a stand-in
view with no file and no editor, and three places here read a markdown leaf's
view as though it always has both. Each decides the note has no editor, and the
turn is refused before the model is called.

Four pieces of work, one report. The deferred-view read is the cause: a leaf is
loaded in place, which restores the editor without moving anything on screen.
The refusal behind it goes, so a note with no leaf at all is written through the
vault rather than the panel telling the user something they can already see.
Turn-end scrolling is tightened to the note the user is actually looking at,
which is the jerk on mobile. The fourth is the transcript, which misattributes a
setup block and is why the report pointed at the wrong turn.

- [0-prompt-design.md](0-prompt-design.md) - hands the design phase to a fresh session, with the code claims worth verifying first
- [2-requirements.md](2-requirements.md) - the failure, the three call sites, why the suite stayed green, and steps to replicate
- [3-decisions.md](3-decisions.md) - how a deferred leaf is matched to a path, and what the fix assumes about the Obsidian API
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - five manual checks, since no test double produces a deferred view
- [meta/1-index.md](meta/1-index.md) - context audit for the requirements phase

Nothing blocking. The design doc is the next piece of work: D2 picked the seam,
and D3 is the mechanical question of whether the locator turns async.
