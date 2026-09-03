# Obsidian Agent Harness: Spec

Widens the plugin from editing one bound note to running Obsidian commands and
searching the vault. Two independent flows: a command opens a note the session
retargets to and edits, or a search answers a question in the panel.

Release 4 of [2-plan.md](../2-plan.md). High-level design:
[architecture/4-obsidian-agent-harness.md](../../architecture/4-obsidian-agent-harness.md).
A delta on AGENTS.md Loading; unlisted components are unchanged.

- [1-harness-mvp/01-index.md](1-harness-mvp/01-index.md) - commands, retargeting and search. Built; the exit test is outstanding.
- [2-settings-command-picker/1-index.md](2-settings-command-picker/1-index.md) - finding a command to allow, without knowing its id. Built.
- [3-tidy-up-chat-panel/1-index.md](3-tidy-up-chat-panel/1-index.md) - three weights for six entry kinds, and a pending indicator.
- [4-sessions-without-a-note/1-index.md](4-sessions-without-a-note/1-index.md) - starting a session with no note open.
- [5-cancelling-a-turn/1-index.md](5-cancelling-a-turn/1-index.md) - stopping a turn that is running, and saying what it left.
- [6-model-chosen-targets/1-index.md](6-model-chosen-targets/1-index.md) - opening a note the model located itself.
- [7-finding-notes/1-index.md](7-finding-notes/1-index.md) - a glob over paths and a grep over content, replacing fuzzy search.

Related specs

- [1-requirements.md](../1-requirements.md) - the single-note baseline this widens
- [3-agents-md-loading/1-index.md](../3-agents-md-loading/1-index.md) - per-folder instructions a retargeted note must honour
- [7-cross-file-skills/1-index.md](../7-cross-file-skills/1-index.md) - multi-file writes, which stay out of this release
