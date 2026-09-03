# Cancelling a Turn: Spec

Lets the user stop a turn that is running. Today the panel disables its input
until the turn finishes, so a model heading the wrong way arrives there.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which made a turn long
enough to be worth stopping. A single-note edit was quick and bounded; a turn
that searches, runs commands and retargets can spend ten iterations, and each one
may write.

- [2-requirements.md](2-requirements.md) - where a turn can be stopped, and what it leaves behind

Undo stays out, with [7-cross-file-skills](../../7-cross-file-skills/1-index.md).
The vault keeps what a cancelled turn wrote, and the obligation here is to report
that rather than repair it.

[6-model-chosen-targets](../6-model-chosen-targets/1-index.md) depends on this:
its FR29 says a parked question settles when the turn is cancelled, which needs a
cancel to exist.

Not designed yet. The open question is what carries the cancellation to the loop,
the provider request and a parked question, which are three different places.
