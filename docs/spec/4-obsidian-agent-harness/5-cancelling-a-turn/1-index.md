# Cancelling a Turn: Spec

Lets the user stop a turn that is running. Today the panel disables its input
until the turn finishes, so a model heading the wrong way arrives there.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which made a turn long
enough to be worth stopping. A single-note edit was quick and bounded; a turn
that searches, runs commands and retargets can spend ten iterations, and each one
may write.

- [2-requirements.md](2-requirements.md) - where a turn can be stopped, and what it leaves behind
- [3-component-design.md](3-component-design.md) - the cancellation value, and the three places that read it
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, branch by branch
- [5-implementation-order.md](5-implementation-order.md) - build order and the exit test

Undo stays out, with [7-cross-file-skills](../../7-cross-file-skills/1-index.md).
The vault keeps what a cancelled turn wrote, and the obligation here is to report
that rather than repair it.

[6-model-chosen-targets](../6-model-chosen-targets/1-index.md) depends on this:
its FR29 says a parked question settles when the turn is cancelled, which needs a
cancel to exist.

The cancellation is one value held for the turn, rather than a flag passed to
each. The loop reads whether it happened, the provider takes its signal, and a
parked question races its own answer against it.

Built, exit test pending.
