---
created: 2026-09-10
updated: 2026-09-11
---

# Copying the Session Transcript: Spec

A session that failed is worth keeping, and the panel is its only record.
Nothing there can be copied as a whole: the steps list collapses, a screenshot
truncates it, and the inputs that produced the failure were never on screen.

One button in the header, beside Reset and off until a setting turns it on, puts
the session on the clipboard as Markdown. It nests the way the engine runs: a
conversation turn per utterance, holding the turn steps it spent. Anything
unchanged between steps goes to an appendix, cited from the steps that used it.

The clipboard call and its copied-state feedback already exist on each reply
entry. This widens the same gesture to the session.

- [0-prompt.md](0-prompt.md) - the block to paste to a fresh agent building this
- [2-requirements.md](2-requirements.md) - what a filed session must carry, and what is still open
- [3-design.md](3-design.md) - the goal, what is out of scope, and where the detail lives
- [3a-document-shape.md](3a-document-shape.md) - the two groupings, and what a turn step sends
- [3b-wiring.md](3b-wiring.md) - the store, the setting, and the button
- [4-sample-output.md](4-sample-output.md) - the format, taken from the reported session
- [5-test-plan.md](5-test-plan.md) - the unit cases, per class
- [6-tasks.md](6-tasks.md) - build order in four commits
