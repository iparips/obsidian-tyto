---
created: 2026-09-11
updated: 2026-09-11
---

# Settings Tab on the Setting API

The React panel is replaced by `Setting` builders. The command picker is the
one part that stays React: it is a live search with a result list, which the
Setting API does not express, and it already renders into its own container.

## Shape After the Change

```
(no heading)              API key, edit model
setHeading('Skills')      Skills folder
setHeading('Commands')    Allowed commands, and the React picker below it
setHeading('Vault')       Search the vault, ask which note, copy transcript
```

The general settings sit at the top with no heading, which is the rule for a
tab that has more than one section. Every label is sentence case, and no
heading carries the word "settings".

## What Moves

Each setting keeps its current description text, moved from the
settings-note paragraph into `setDesc()`. The text is already written for a
user rather than a developer, so it transfers as is.

The API key uses `addText` with the input's type set to password, matching what
the React input does today. The three checkboxes become `addToggle`.

The CSS that styled the hand-rolled rows goes. What styles the picker stays.

## What This Costs

The settings tests under src/settings/tests are written against the React
components. Those covering SettingsPanel (Tyto) go with it; those covering
CommandPicker, AllowedEntries and ResolvedCommands (Tyto) stay, because those
components stay.

This is the one task in the spec that deletes passing tests. Worth saying out
loud so it does not read as a regression in review: the behaviour they asserted
moves into a builder chain that Obsidian owns, and a test that asserts
Obsidian renders its own Setting correctly is not a test worth writing.
