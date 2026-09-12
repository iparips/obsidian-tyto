---
created: 2026-09-11
updated: 2026-09-11
---

# Implementation Order

Seven commits. Each leaves the suite green and the plugin loadable, so the
order can stop at any point without a half-migrated vault.

## 1. Rename Owl to Tyto

Mechanical, and large. Kept apart from the migration in commit 2 so that a
review can read the rename as a rename, with no logic hidden in the noise.

- Manifest id to `tyto`, name to `Tyto`.
- Identifiers: OwlPlugin, OwlSettings, OwlSettingsTab and the settings type
  become Tyto-prefixed.
- The five user-visible strings: ribbon tooltip, view display text, transcript
  heading, background-recording notice, and the settings aria-label.
- The view type constant, `owl-session` to `tyto-session`.
- CSS prefix `owl-` to `tyto-`, in src and styles.css in the same commit.
- The CONTRIBUTING.md sentence naming the plugin folder.

Exit test: the suite is green, including the prompt fixture, which the rename
must not touch. Grep for `Owl` and `owl-` in src returns nothing.

## 2. Migrate Settings Across the Id Change

The blocker's real cost, and the only task that touches a user's stored data.

- Add LegacySettingsMigration (Tyto, new) under settings/, reading the legacy
  path through the adapter and writing through the plugin's saveData.
- Call it from `onload`, in place of the current `loadData` spread.
- Teach the installer to remove a stale `obsidian-owl` folder.

Exit test: install over a vault holding an Owl-era config, confirm the API key
and allow list survive, and that the old plugin folder is gone. Then install
into a clean vault and confirm the defaults load with nothing logged.

## 3. Disclose Network Use in the README

No code. Do it before the settings work, so a half-finished branch still
carries the disclosure the policies require.

- Add the disclosure section after "What it does not do".
- Cover the service, what is sent, when, why, the account, the transcript, and
  what never leaves.

Exit test: read it as a stranger and answer "what leaves my vault, and to
whom" without opening another file.

## 4. Silence the Console

Small and isolated.

- Remove all eight `console.debug` calls.
- Keep the surrounding catch blocks and their behaviour.

Exit test: run a full turn with the console at default level and see nothing
printed.

## 5. Rebuild the Settings Tab

The largest task, and the one a reviewer is most likely to comment on.

- Replace SettingsPanel (Tyto) with Setting builders in TytoSettingsTab (Tyto).
- Three sections via `setHeading()`: Skills, Commands, Vault. General settings
  stay at the top with no heading.
- Move each note paragraph into the matching `setDesc()`.
- Keep the React command picker, mounted into its own container under the
  Commands section.
- Delete the CSS that styled the removed rows.

Exit test: the tab sits beside a core plugin's settings and looks native. The
picker still finds a command and adds it.

## 6. Move Vault Reads Off the Adapter

- AgentsMdRepository and SkillRepository take Vault rather than DataAdapter.
- Read with `cachedRead`, resolve with `getFileByPath` and `getFolderByPath`.
- Wrap constructed paths in `normalizePath()`.
- Leave SessionStore on the adapter, and add the line saying why.
- Move the skill and AGENTS.md fixtures in test-support from FakeAdapter onto
  FakeVault.

Exit test: skills still load from a normal vault folder, and an AGENTS.md in a
note's folder chain still reaches the prompt.

## 7. Tighten the Defaults and the Release Build

- DEFAULT_SETTINGS ships an empty allow list and search off.
- Add the `build:release` script without `--sourcemap`.
- Point RELEASE.md step 2 at it.

Exit test: a fresh vault runs no command and searches nothing until the
checkboxes are ticked. A release build ends with no sourceMappingURL comment.

## Before Raising the PR

Not commits. The things to do once, by hand.

- Rotate the Mistral key that sits in the working tree's data.json.
- Cut a release whose tag matches the manifest version, with main.js,
  manifest.json and styles.css attached.
- Confirm the manifest on the default branch is the one the directory will
  read.
