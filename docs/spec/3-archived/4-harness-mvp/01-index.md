# Harness MVP: Spec

Widens the plugin from editing one bound note to running Obsidian commands and
searching the vault. Two independent flows: a command opens a note the session
retargets to and edits, or a search answers a question in the panel.

Built, and the suite passes. The exit test in
[10-implementation-order.md](10-implementation-order.md) still needs a run by hand
in a real vault. Every question the design left open is settled in
[04-decisions.md](04-decisions.md).

- [02-requirements.md](02-requirements.md) - problem, goals, user stories, the two flows
- [03-functional-requirements.md](03-functional-requirements.md) - numbered functional and non-functional requirements
- [04-decisions.md](04-decisions.md) - decisions made, and the questions the design settles
- [05-component-design.md](05-component-design.md) - packages, the private-API question, prompt and loop changes
- [06-commands-and-rebinding.md](06-commands-and-rebinding.md) - allow-list resolution, running a command, moving the target note
- [07-search-and-answering.md](07-search-and-answering.md) - scoring, bounded cost, and why the answer stops at the panel
- [08-data-model.md](08-data-model.md) - new types, session state, settings fields, panel entries and tool schemas
- [09-testing-strategy.md](09-testing-strategy.md) - unit test outline and the four new fakes
- [10-implementation-order.md](10-implementation-order.md) - the build sequence, what the build added, and the exit test
