# Obsidian Agent Harness: Spec

Widens the plugin from editing one bound note to running Obsidian commands and
searching the vault. Two independent flows: a command opens a note the session
rebinds to and edits, or a search answers a question in the panel.

Implementable spec for release 4 of [2-plan.md](../2-plan.md). High-level design:
[high-level-design/4-obsidian-agent-harness.md](../high-level-design/4-obsidian-agent-harness.md).
A delta on AGENTS.md Loading; unlisted components are unchanged.

Requirements only. No design yet; five questions in
[3-decisions.md](3-decisions.md) gate it.

- [1-requirements.md](1-requirements.md) - problem, goals, user stories, the two flows
- [2-functional-requirements.md](2-functional-requirements.md) - numbered functional and non-functional requirements
- [3-decisions.md](3-decisions.md) - decisions made, and open questions a design must settle

Related specs

- [1-requirements.md](../1-requirements.md) - the single-note baseline this widens
- [3-agents-md-loading/index.md](../3-agents-md-loading/index.md) - per-folder instructions a rebound note must honour
- [7-cross-file-skills/index.md](../7-cross-file-skills/index.md) - multi-file writes, which stay out of this release
