---
created: 2026-09-09
updated: 2026-09-09
---

# Finding a Note by a Relative Date: Spec

"Saturday last week" reaches the wrong note, or no note. The model is given
today's date and left to do the calendar arithmetic itself, which it gets wrong
by days. It then invents a filename in a format the vault does not use, and
keeps searching past the note it had already found.

Three independent faults, each of which loses the turn on its own. The missing
date anchor is the cause; the search rules are what let a wrong date survive to
the end of the turn.

A delta on [10-finding-notes](../10-finding-notes/1-index.md), whose glob rules
this narrows.

- [2-requirements.md](2-requirements.md) - what went wrong in the reported turn, and what a correct one does
- [3-design.md](3-design.md) - the week anchor Today gains, and the two rules that change
- [4-tasks.md](4-tasks.md) - build order in three commits, with the tests that hold each

Not built.
