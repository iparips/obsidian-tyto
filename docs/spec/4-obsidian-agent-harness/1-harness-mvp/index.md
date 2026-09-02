# Harness MVP: Spec

Widens the plugin from editing one bound note to running Obsidian commands and
searching the vault. Two independent flows: a command opens a note the session
retargets to and edits, or a search answers a question in the panel.

Built, and the suite passes. The exit test in
[9-implementation-order.md](9-implementation-order.md) still needs a run by hand
in a real vault. Every question the design left open is settled in
[3-decisions.md](3-decisions.md).

- [1-requirements.md](1-requirements.md) - problem, goals, user stories, the two flows
- [2-functional-requirements.md](2-functional-requirements.md) - numbered functional and non-functional requirements
- [3-decisions.md](3-decisions.md) - decisions made, and the questions the design settles
- [4-component-design.md](4-component-design.md) - packages, the private-API question, prompt and loop changes
- [5-commands-and-rebinding.md](5-commands-and-rebinding.md) - allow-list resolution, running a command, moving the target note
- [6-search-and-answering.md](6-search-and-answering.md) - scoring, bounded cost, and why the answer stops at the panel
- [7-data-model.md](7-data-model.md) - new types, session state, settings fields, panel entries and tool schemas
- [8-testing-strategy.md](8-testing-strategy.md) - unit test outline and the four new fakes
- [9-implementation-order.md](9-implementation-order.md) - the build sequence, what the build added, and the exit test
