# Tidy Up Chat Panel: Spec

Makes the session panel read as a conversation. Every entry is a padded box
today, so a spoken instruction, a note about which files were loaded, and the
agent's reply all carry the same weight.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), which added the
command and instruction entries the panel now shows. Presentation only: no
entry changes what it says, and nothing new is published.

- [2-requirements.md](2-requirements.md) - the problem, and what each entry kind is worth
- [3-component-design.md](3-component-design.md) - the three weights, and where the styling lives
- [4-testing-strategy.md](4-testing-strategy.md) - what a unit test can hold, and what only the eye can
- [5-implementation-order.md](5-implementation-order.md) - the build sequence and the exit test

Three weights, not six. What the user said is a bubble, what the agent said is
plain text beneath it, and what the harness did is a tight muted line.

A pending line holds the reply's place while a turn runs, naming whether the
wait is transcription or the model. Today a running turn only greys the buttons.

The return-note button goes, retiring FR20 of the harness MVP. The session
already rebinds to whatever note the user opens, so opening the starting note is
the path that survives.

Built. The exit test in
[5-implementation-order.md](5-implementation-order.md) is by hand and outstanding.
