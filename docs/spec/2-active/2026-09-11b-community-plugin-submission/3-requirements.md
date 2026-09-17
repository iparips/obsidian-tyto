---
created: 2026-09-11
updated: 2026-09-17
---

# Requirements

What must be true before the plugin is submitted.

## Motivation

The plugin is ready to be listed. Submission is a dashboard, and an automated
scan reads every release rather than only the first, so the scanner is the
reviewer and passing it is the work.

One item in the manifest fails that scan outright. The README is missing the
disclosures the developer policies require for a plugin that sends note content
to a remote service. Both are cheap to fix now and expensive to fix as review
round trips.

The manifest fix forces a rename, and a rename is cheaper before a public
listing than after one. So the plugin becomes Tyto in the same change.

The scan runs Obsidian's own ESLint plugin. Adopting it was the first item, and
it turned the rest of this list from a reading of the documentation into
something the build checks, which keeps checking after the listing lands.

## In Scope

- Rename the plugin from Owl to Tyto: the id, the display name, the
  user-visible strings, the identifiers, and the CSS prefix.
- Migrate an existing install's settings across the id change.
- Disclose network use, the account requirement, and the transcript's reach in
  the README.
- Adopt eslint-plugin-obsidianmd, and fix what it reports.
- Rebuild the settings tab on the declarative settings API, with sentence-case
  names and grouped sections. The minAppVersion it needs is already 1.13.0.
- Silence debug logging in normal use.
- Move vault reads off the adapter, except the plugin-config write that has no
  Vault API equivalent, and normalise constructed paths.
- Ship defaults that touch nothing until the user opts in.
- Give `build` the shape the scan's build verification expects, and drop the
  dangling source-map reference from it.
- Name the copyright holder in the LICENSE.
- Rewrite the README for someone installing from the directory.

## Out of Scope

- The repository name. Only the manifest id is constrained, and renaming the
  repo breaks every existing link for no gain.
- The saved workspace leaf. Renaming the view type drops it, costing a panel
  position rather than a session; migrating it means writing to a file
  Obsidian owns.
- Minifying the bundle. Worth doing, not required, and the policies forbid
  obfuscation rather than requiring small output.
- Supporting Obsidian below 1.13.0. The declarative settings API needs it, and
  the plugin has never been listed, so there is no installed base to strand.
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

### The scan's linter reports nothing

```gherkin
Given eslint-plugin-obsidianmd is installed with its recommended config
When  the lint script runs over src
Then  no error is reported
And   the only warnings name the settings tab or the provider's use of fetch
```

### Build verification reproduces the shipped bundle

```gherkin
Given a release cut from a clean checkout
When  the scanner runs the build script and compares the output
Then  the rebuilt main.js matches the released one
And   neither carries a sourceMappingURL comment
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

## Decisions

All three are settled, so a fresh session starts on none of them.

Migrate silently, with no notice

- A notice makes a failed migration visible rather than looking like lost
  settings, which is the argument for one. It loses, because the plugin has
  never been listed, so the only vault a migration runs in is Ilya's own.

minAppVersion rises to 1.13.0

- The declarative settings API needs it. Nobody is stranded, for the same reason
  as above, and the alternative is two renderers kept in step for no user.

The allow-list examples become daily-notes and open-or-create-file-command:*

- `daily-notes:*` goes entirely. It is invalid rather than merely unhelpful, so
  it misleads a reader into writing an entry that matches nothing.

## References

### Task

- [2-audit/1-index.md](2-audit/1-index.md) - open first: every rule checked,
  with the evidence and the file it sits in
- [4-design/6-the-automated-review.md](4-design/6-the-automated-review.md) -
  open second: the scanner that judges the submission, and what it runs
- manifest.json - the id, the description the directory reads, and the
  minAppVersion the settings API moves
- src/settings/settings.ts - the defaults two scenarios assert on
- package.json - the build script the scan's verification calls

### Project

- [../../../RELEASE.md](../../../RELEASE.md) - open when cutting the release
  the submission points at; its step 2 names the build script that changes
- [../../../CONTRIBUTING.md](../../../CONTRIBUTING.md) - open when the build
  scripts change; it documents them for a person

### Architecture

- [../../../../AGENTS.md](../../../../AGENTS.md) - open when placing new code;
  owns package layout and the rule that prompt changes are behaviour changes

### External

- docs.obsidian.md/community-directory/faq - the scan's sections, its ignored
  paths, and the build scripts it looks for
- github.com/obsidianmd/eslint-plugin - the rule list the source-code section
  runs
- docs.obsidian.md/plugins/guides/migrate-declarative-settings - the settings
  API the tab moves to
