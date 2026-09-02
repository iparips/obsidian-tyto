# Obsidian Agent Harness: Spec

Widens the plugin from editing one bound note to running Obsidian commands and
searching the vault. Two independent flows: a command opens a note the session
retargets to and edits, or a search answers a question in the panel.

Release 4 of [2-plan.md](../2-plan.md). High-level design:
[architecture/4-obsidian-agent-harness.md](../../architecture/4-obsidian-agent-harness.md).
A delta on AGENTS.md Loading; unlisted components are unchanged.

- [1-harness-mvp/index.md](1-harness-mvp/01-index.md) - commands, retargeting and search. Built; the exit test is outstanding.
- [2-settings-command-picker/index.md](2-settings-command-picker/1-index.md) - finding a command to allow, without knowing its id.

Related specs

- [1-requirements.md](../1-requirements.md) - the single-note baseline this widens
- [3-agents-md-loading/index.md](../3-agents-md-loading/1-index.md) - per-folder instructions a retargeted note must honour
- [7-cross-file-skills/index.md](../7-cross-file-skills/1-index.md) - multi-file writes, which stay out of this release
