---
created: 2026-09-11
updated: 2026-09-17
---

# Logging, Vault Reads, and Defaults

Three changes, none of which touches more than a handful of lines.

## Logging

Every `console.debug` is removed rather than gated behind a setting. A debug
flag is a feature, and these calls are developer aids rather than something a
user would switch on.

Two of them sit on a failure path and become silent. SessionFileStore already
treats a failed write as a session that was not recorded, and the catch block
keeps that behaviour with the log gone.

The model-iteration log in ModelService (Tyto) is the one worth keeping during
development. It moves behind the existing test suite rather than the console:
the turn outcome is already asserted there.

## Vault Reads and Path Normalisation

AgentsMdRepository and SkillRepository move from DataAdapter to Vault.

| Collaborator       | Today                      | New                                                   |
| ------------------ | -------------------------- | ----------------------------------------------------- |
| AgentsMdRepository | adapter.read               | vault.getFileByPath then vault.cachedRead             |
| SkillRepository    | adapter.list, adapter.read | vault.getFolderByPath then children, vault.cachedRead |
| SessionFileStore   | adapter.write and read     | unchanged, see below                                  |

`cachedRead` rather than `read`, because both collaborators read files for
their content and never write them back. That is the case the cache exists for.

SessionFileStore stays on the adapter. It writes into the plugin's config folder,
which is outside the vault's file tree, so the Vault API cannot address it. A
comment already explains the path; it gains a line saying why the adapter is
correct here, so the next audit does not flag it.

Both migrated collaborators wrap their constructed paths in `normalizePath()`.
The skills path is user-typed and the AGENTS.md path is built from a note's
folder chain, so both are exactly what the rule names.

The fakes in src/test-support change with the ports. FakeVault already stands
in for the Vault, so the work is moving the skill and AGENTS.md fixtures onto
it from FakeAdapter.

## Defaults

Two defaults change.

```ts
commandAllowList: [],
searchEnabled: false,
```

A fresh install then runs no command and reads no note beyond the one in the
session. Both are one checkbox away, and the settings text already explains
what each turns on.

This is a behaviour change for an existing user, which is why it lands after
the migration: a migrated settings file carries the user's own values, so only
a genuinely new install sees the new defaults.

The release bundle changes too, and
[6-the-automated-review.md](6-the-automated-review.md) owns it: the build
verification the scan runs decides which script drops `--sourcemap`.
