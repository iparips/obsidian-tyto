---
created: 2026-09-11
updated: 2026-09-11
---

# Requirements

What must be true before the submission PR is raised.

## Motivation

The plugin is ready to be listed, and the listing is reviewed automatically
before a human sees it. One item in the manifest fails that review outright,
and the README is missing the disclosures the developer policies require for a
plugin that sends note content to a remote service. Both are cheap to fix now
and expensive to fix as review round trips.

The manifest fix forces a rename, and a rename is cheaper before a public
listing than after one. So the plugin becomes Tyto in the same change.

## In Scope

- Rename the plugin from Owl to Tyto: the id, the display name, the
  user-visible strings, the identifiers, and the CSS prefix.
- Migrate an existing install's settings across the id change.
- Disclose network use, the account requirement, and the transcript's reach in
  the README.
- Rebuild the settings tab on Obsidian's Setting API, with sentence-case labels
  and `setHeading()` sections.
- Silence debug logging in normal use.
- Move vault reads off the adapter, except the plugin-config write that has no
  Vault API equivalent, and normalise constructed paths.
- Ship defaults that touch nothing until the user opts in.
- Build the release bundle without a dangling source-map reference.

## Out of Scope

- The repository name. Only the manifest id is constrained, and renaming the
  repo breaks every existing link for no gain.
- The saved workspace leaf. Renaming the view type drops it, costing a panel
  position rather than a session; migrating it means writing to a file
  Obsidian owns.
- Minifying the bundle. Worth doing, not required, and the policies forbid
  obfuscation rather than requiring small output.
- A second provider. The single-provider design is what the disclosure
  describes.

## Test Scenarios

Setup shared by every scenario:

- A vault with the plugin installed from a release build, not a symlinked
  checkout.
- A Mistral API key available but not yet entered.

### The manifest passes the directory's id check

```gherkin
Given the manifest id is read by the community directory
When  the automated review runs
Then  the id contains no occurrence of the string obsidian
And   the id matches the plugin folder name in the vault
```

### An existing install keeps its settings across the rename

```gherkin
Given a vault holding settings under the plugin id obsidian-owl
When  the renamed plugin loads for the first time
Then  the API key, allow list and skills path are unchanged
And   a session left behind is still restored
```

### The old name is gone from everything the user sees

```gherkin
Given the renamed plugin is installed
When  the user opens the ribbon, the command palette and the session panel
Then  each reads Tyto
And   a copied transcript is headed Tyto rather than Owl
```

### A fresh install touches nothing before the user asks

```gherkin
Given the plugin is installed and no setting has been changed
When  the user opens a note and starts a session
Then  no Obsidian command is allowed to run
And   the vault is not searched
```

### The console stays quiet through a normal turn

```gherkin
Given the developer console is open at its default level
When  the user records an instruction and the edit lands
Then  no debug or log message is printed
And   an error is printed only where a step failed
```

## Questions

- Should the rename migrate silently, or tell the user it happened? Silent is
  kinder and leaves no trace if it goes wrong; a notice makes a failed
  migration visible rather than looking like lost settings.

## References

### Task

- [2-audit/1-index.md](2-audit/1-index.md) - open first: every rule checked,
  with the evidence and the file it sits in
- manifest.json - the id, and the description the directory reads
- src/settings/settings.ts - the defaults two scenarios assert on

### Project

- [../../RELEASE.md](../../../RELEASE.md) - open when cutting the release the
  submission points at; the asset list is already correct

### Architecture

- [../../AGENTS.md](../../../AGENTS.md) - open when placing new code; owns package
  layout and the rule that prompt changes are behaviour changes
