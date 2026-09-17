---
created: 2026-09-11
updated: 2026-09-11
---

# A Tool for Relative Dates: Spec

"Last Friday" still reaches the wrong note. The model is told today's date, its
ISO week and the Monday that week began, and told to resolve relative dates
against them. On Friday 2026-09-11 it resolved "last Friday" to 09-10, then to
09-11, and never once to 09-04.

Two rounds of prompt have failed on the same arithmetic. This gives the model a
tool instead. It sends the user's own words, chrono-node reads the date out of
them, and the glob rules make that the only place a spoken date can come from.

A delta on [relative-dates](../2026-09-09-relative-dates/1-index.md), which is the
prompt-only fix this replaces. The repeated globbing in the same turn is
[20-repeated-searches](../../1-upcoming/20-repeated-searches/1-index.md), and is not
respecified here.

- [0-prompt.md](0-prompt.md) - the block to paste to a fresh agent building this
- [2-requirements.md](2-requirements.md) - the reported turn, and what a correct one does
- [3-design.md](3-design.md) - the goal, what is out of scope, and where the detail lives
- [3a-interface.md](3a-interface.md) - the single argument, what it answers, what it refuses, and the two libraries
- [3b-wiring.md](3b-wiring.md) - the classes, the dispatch, and the one prompt rule
- [3c-test-plan.md](3c-test-plan.md) - the unit cases, per class
- [4-tasks.md](4-tasks.md) - build order in three commits

Built. The manual cases are FN9 to FN11 in
[4-finding-notes.md](../../../manual-tests/4-finding-notes.md).
