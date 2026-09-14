---
created: 2026-09-14
updated: 2026-09-14
---

# Wiring And Entry Points: Spec

A package is a branch of the tree. The branch is named after the service that
owns it, one index.ts is the entry the parent reaches, and the interior is
private. Two things stop that rule working today: EngineFactory constructs
classes from four other packages, and four packages have no single owner to name
themselves after.

This spec adds the building block that resolves the first, and surveys the
second so a later spec can act on it.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - what the rule is and what may not change
- [3-design.md](3-design.md) - wiring as a building block, and the three package kinds
- [4-survey.md](4-survey.md) - every package, its entry surface, and the four with no owner
- [5-tasks.md](5-tasks.md) - build order in five commits
- [6-cycles.md](6-cycles.md) - the two package cycles, and what closes each
- [7-plugin-scope.md](7-plugin-scope.md) - the one class this spec adds, in full
- [8-value-types.md](8-value-types.md) - commit 4: the two misplaced repositories

Not built.
