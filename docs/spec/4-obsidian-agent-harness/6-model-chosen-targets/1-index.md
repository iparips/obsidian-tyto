# Model-Chosen Targets: Spec

Lets the model open a note it located itself, rather than only one a command
opened. A command is still preferred where one matches, and a confirmation mode
decides whether the model asks first.

Where no route resolves the note, the model asks the user rather than guessing.
A notice says the turn wants them, so a question on a phone is not left behind a
closed drawer, and the panel is never opened over the note they are reading.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which routes every
destination through a command. That rule was written before search shipped:
search makes a path checkable, so opening an existing note is a lookup rather
than the guess the rule guards against.

- [2-requirements.md](2-requirements.md) - problem, the two modes, asking the user, and what the design must settle
- [3-component-design.md](3-component-design.md) - the open tool, the two askers, and the notices
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, branch by branch
- [5-implementation-order.md](5-implementation-order.md) - build order in two commits, and an exit test for each

Creating a note at a model-chosen path stays out, with
[7-cross-file-skills](../../7-cross-file-skills/1-index.md), because a wrong
guess there lands a stray note with no error and needs that release's undo
story.

The pause turned out to be cheap. The loop already awaits every tool call, so a
dispatcher that settles on a click parks the turn where it stands. The design's
work is a channel that carries an answer back, since the progress publisher is
one-way by design.

A confirmation and a question park a turn the same way, so PendingAnswer
(Engine, new) is the shared mechanism and the two askers differ only in what
comes back. The notices are one collaborator over Obsidian's own Notice, which
persists at a zero duration.

Built, exit tests pending. It needed
[5-cancelling-a-turn](../5-cancelling-a-turn/1-index.md) first, since a parked
question settles on that spec's cancellation.
