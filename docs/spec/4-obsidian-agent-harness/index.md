# Obsidian Agent Harness: Spec

Widens the plugin from editing one bound note to running Obsidian commands and
searching the vault. Two independent flows: a command opens a note the session
rebinds to and edits, or a search answers a question in the panel.

Implementable spec for release 4 of [2-plan.md](../2-plan.md). High-level design:
[architecture/4-obsidian-agent-harness.md](../../architecture/4-obsidian-agent-harness.md).
A delta on AGENTS.md Loading; unlisted components are unchanged.

Ready to implement. Start at
[9-implementation-order.md](9-implementation-order.md), which sequences the work
and names the files. The two questions that decided feasibility are settled in
[4-component-design.md](4-component-design.md); four remain, and they shape
steps 8, 13 and 14 rather than gating the release.

- [1-requirements.md](1-requirements.md) - problem, goals, user stories, the two flows
- [2-functional-requirements.md](2-functional-requirements.md) - numbered functional and non-functional requirements
- [3-decisions.md](3-decisions.md) - decisions made, and the questions the design settles
- [4-component-design.md](4-component-design.md) - packages, the private-API question, prompt and loop changes
- [5-commands-and-rebinding.md](5-commands-and-rebinding.md) - allow-list resolution, running a command, moving the binding
- [6-search-and-answering.md](6-search-and-answering.md) - scoring, bounded cost, and why the answer stops at the panel
- [7-data-model.md](7-data-model.md) - new types, settings fields, panel entries and tool schemas
- [8-testing-strategy.md](8-testing-strategy.md) - unit test outline and the two new fakes
- [9-implementation-order.md](9-implementation-order.md) - the build sequence, exit test and what to decide while building

Related specs

- [1-requirements.md](../1-requirements.md) - the single-note baseline this widens
- [3-agents-md-loading/index.md](../3-agents-md-loading/index.md) - per-folder instructions a rebound note must honour
- [7-cross-file-skills/index.md](../7-cross-file-skills/index.md) - multi-file writes, which stay out of this release
