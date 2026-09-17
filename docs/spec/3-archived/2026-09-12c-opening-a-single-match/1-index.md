---
created: 2026-09-12
updated: 2026-09-12
---

# Opening A Single Match: Spec

Auto mode opens the first note of however many the model offers. That is a guess
made on the user's behalf, and it is the half of the mode worth removing.

What is left once it goes is a mode worth having: open a note when the search
found exactly one, ask when it found several. No question where there is nothing
to choose between, and no guess where there is.

Confirm mode is unchanged. A user who wants to see every open before it happens
still has one.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - what each mode promises, and what auto stops doing
- [3-design.md](3-design.md) - where the single-match branch goes, and the rules that follow it
- [4-tasks.md](4-tasks.md) - build order in two commits

Narrows FR13 of [choosing-the-note](../2026-09-03h-choosing-the-note/2-requirements.md),
which defined auto mode as taking the first candidate.

Built.
