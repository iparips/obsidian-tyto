---
created: 2026-09-17
updated: 2026-09-17
---

# Naming What A Turn Touched: Spec

A turn wrote potatoes to the shopping list correctly, then told the user it
could not find the shopping list. The write was right; everything the panel and
the prompt said about it was not.

Three things the panel says wrongly or not at all, now that a turn holds its own
target. It narrates note switches that meant something when the header named one
note. It cannot say a progress line acted on another note. And it never says a
write took the vault path rather than the editor.

- [3-requirements.md](3-requirements.md) - the three lines nobody asked for, the line that cannot name its note, and the silent fallback
- [4-decisions.md](4-decisions.md) - what shows, what names its target, and how loud the fallback is
- [5-acceptance-criteria.md](5-acceptance-criteria.md) - three checks, all needing a real vault
- [6-design.md](6-design.md) - what a line names, and what the panel stops saying
- [6-design-the-warning.md](6-design-the-warning.md) - where the vault write is announced, and what it says
- [7-unit-tests.md](7-unit-tests.md) - the unit tests each changed method needs
- [8-tasks.md](8-tasks.md) - three commits, each shippable alone
- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it

The user's mid-turn move stops showing, and the retargeted entry kind goes with
it: the turn's target says what the header used to, so eleven entry kinds become
ten. The retargets channel stays, since the panel still needs to know what the
next turn opens on.

A progress line names its note only where that note differs from the turn's
target. The turn names its target at the top, so repeating it down the list
buries the one line worth reading.

A vault write marks the edit line that made it, rather than announcing itself
beside the list: the line sits where the edit happened and names the note, which
a warning below the list did neither of. It is worded for undo being lost, which
is the safer way to be wrong. Whether undo actually survives a Vault.process
write is still unknown and no longer blocks anything; it decides the wording,
not the design.

Every decision is settled and the design is written.

Downstream of
[reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md), which gave the
turn its target and the write its fallback, and left both unsaid.
