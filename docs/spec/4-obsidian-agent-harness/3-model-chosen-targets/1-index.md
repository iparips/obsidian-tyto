# Model-Chosen Targets: Spec

Lets the model open a note it located itself, rather than only one a command
opened. A confirmation mode decides whether it asks first.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which routes every
destination through a command. That rule was written before search shipped:
search makes a path checkable, so opening an existing note is a lookup rather
than the guess the rule guards against.

- [2-requirements.md](2-requirements.md) - problem, the two modes, and what the design must settle

Creating a note at a model-chosen path stays out, with
[7-cross-file-skills](../../7-cross-file-skills/1-index.md), because a wrong
guess there lands a stray note with no error and needs that release's undo
story.

Not designed yet. The hard part is that a turn is one promise resolving to a
summary, and a confirmation pauses it mid-flight.
