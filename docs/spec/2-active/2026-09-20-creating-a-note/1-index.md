---
created: 2026-09-20
updated: 2026-09-20
---

# Creating A Note: Spec

The plugin cannot create a note. Every write lands in a note that already exists and is already open, and the only thing that creates one is the daily-notes command, incidentally, by opening today's note.

Commands are what Ilya is turning off. Running one opens a note in the active leaf, which on mobile pulls the screen off the chat panel mid-turn. Emptying commandAllowList removes the jerk and removes the only creating call the model has, so a create_note tool is what replaces it.

The work is one tool: a path, a confirmation, an empty note, and the session bound to it. The risk is not destruction, since nothing is overwritten, but a stray note in the wrong folder under a name the vault would not have chosen. That is what the confirmation and the glob-before-you-guess prompt line are for.

- [2-requirements.md](2-requirements.md) - why turning commands off leaves no route to a new note, and what the tool does about it
- [3-decisions.md](3-decisions.md) - the four open decisions, two of them blocking, and the three assumptions about the Obsidian API and the turn's target
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - five checks on a real vault, since whether the model globs before it guesses is a judgement no unit test makes

## Not ready for design

Two blocking decisions are open, and both change the tool's signature or which vaults are sent it.

- D1: whether folder creation is always recursive or takes a flag. The recommendation is always, since the confirmation shows the whole path and a flag moves the judgement to the model.
- D2: whether the tool is offered when search is off. The recommendation is to gate it on search, since glob_notes is how the naming convention is discovered.

D3 and D4 are open but not blocking, and are the design's to close.

The design handover is not written. It goes out once D1 and D2 are answered, since a design guessing either builds the wrong schema.
