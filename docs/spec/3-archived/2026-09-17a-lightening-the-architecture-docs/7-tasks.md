---
created: 2026-09-17
updated: 2026-09-17
---

# Tasks

Build order. Each task leaves the folder in a state where every link resolves,
so the link script can run after any of them.

## 1. Script the link check

Write the check before moving a file, so it can prove the move. It finds every
markdown link into docs/architecture, resolves it relative to its own file, and
fails on a target that does not exist.

Run it once before any change: thirty-four links, zero broken, is the baseline.

## 2. Write the seven files

Written before the old ones are deleted, so the content can be checked against
its source. New names sit beside the old for one task.

Order follows dependency: the overview names the others, and the vocabulary is
what they all use.

1. 1-overview.md, holding the package table, the dependency rule and diagram,
   the two cycles, the construction rule, the size limit, and the index of the
   other six.
2. 2-vocabulary.md, from 12-the-panel-vocabulary with the title changed and
   references repointed.
3. 4-the-turn.md, taking 8 and 9 plus engine's folder layout.
4. 5-asking-the-model.md, taking 10 plus the two AGENTS.md boundaries.
5. 7-the-panel.md, taking 11 plus wiring's three scopes.
6. 3-capture.md.
7. 6-reaching-a-note.md, whose diagram is the one that is invented.

Each file carries at least one diagram, and the folder stays under 500 lines.

## 3. Delete the thirteen

Remove all thirteen old files once the seven are written. The link check will
fail here, naming every reference that needs repointing, which is the list task
4 works through.

## 4. Repoint the inbound links

Work the script's failure list. The mapping is in the design's Links In And Out
table. AGENTS.md needs its Package Layout sentence rewritten, not just its
target swapped.

Run the script until it reports zero broken.

## 5. Check the acceptance criteria

- Under 500 lines: wc -l over the folder.
- A diagram per file: grep for the mermaid fence.
- No count or listing a new file would falsify: read each file for a number.
- Every link resolves: the script.

Then read the seven as a fresh reader would, for the delta clause: no file
should send the reader to a second one to learn what is true now.
