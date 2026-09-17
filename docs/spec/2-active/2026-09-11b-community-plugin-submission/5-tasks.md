---
created: 2026-09-11
updated: 2026-09-17
---

# Implementation Order

Ten commits. Each leaves the suite green and the plugin loadable, so the order
can stop at any point without a half-migrated vault.

Commit 1 has shipped. The linter comes next, because it is the commit that
checks the other nine.

## 1. Rename Owl to Tyto (done, shipped)

The manifest id, the identifiers, the user-visible strings, the view type and
the CSS prefix all read Tyto, and the prompt fixture stayed green.
[4-design/2-id-and-migration.md](4-design/2-id-and-migration.md) records what it
covered.

Nothing to do here. Two things it left for later, both deliberate:

- The stored settings still sit under the old id. That is commit 3, which is the
  migration the rename made necessary.
- The docs and README still say Owl in prose, including "Owl runs an Obsidian
  command you have allowed". Commit 9 sweeps them.

## 2. Adopt the Scanner's Linter

First, because it re-audits the repo for free and every later commit then lands
against a gate rather than a document.

- Add eslint-plugin-obsidianmd as a dev dependency, and raise ESLint 8 to 9.
- Replace .eslintrc with eslint.config.mjs on its recommended preset.
- Fix what it reports, except the settings-tab rules, which commit 6 owns.
- Record anything it raises that this spec's audit missed.

Exit test: `bun run lint` is clean but for the settings-tab rules, and those
name only the settings tab.

## 3. Migrate Settings Across the Id Change

The blocker's real cost, and the only task that touches a user's stored data.

- Add LegacySettingsMigration (Tyto, new) under settings/, reading the legacy
  path through the adapter and writing through the plugin's saveData.
- Call it from `onload`, in place of the current `loadData` spread.
- Teach the installer to remove a stale `obsidian-owl` folder.

Exit test: install over a vault holding an Owl-era config, confirm the API key
and allow list survive, and that the old plugin folder is gone. Then install
into a clean vault and confirm the defaults load with nothing logged.

## 4. Disclose Network Use in the README

No code. Do it before the settings work, so a half-finished branch still
carries the disclosure the policies require.

- Add the disclosure section after "What it does not do".
- Cover the service, what is sent, when, why, the account, the clipboard, and
  what never leaves.

Exit test: read it as a stranger and answer "what leaves my vault, and to
whom" without opening another file. Search it for "clipboard" and find it.

## 5. Silence the Console

Small and isolated.

- Remove all eight `console.debug` calls.
- Keep the surrounding catch blocks and their behaviour.

Exit test: run a full turn with the console at default level and see nothing
printed.

## 6. Rebuild the Settings Tab

The largest task, and the one the scan comments on today.

- Raise minAppVersion to 1.13.0, and map 0.1.0 to it in versions.json.
- Implement `getSettingDefinitions()` on TytoSettingsTab (Tyto), and delete
  `display()` with SettingsPanel (Tyto).
- Three groups: Skills, Commands, Vault. The two general settings sit above the
  first group.
- Move each note paragraph into the matching definition's `desc`.
- Keep the React command picker, mounted from the allow list's `render`
  callback, returning its unmount function.
- The API key is a `render` callback too, setting `inputEl.type = 'password'`.
  No declarative control masks a value, and the panel masks it today.
- Delete the CSS that styled the removed rows.

Exit test: the settings-tab lint rules go quiet. The tab sits beside a core
plugin's settings and looks native, the API key still renders as dots, the
picker still finds a command, and the settings appear in 1.13's settings
search.

## 7. Move Vault Reads Off the Adapter

- AgentsMdRepository and SkillRepository take Vault rather than DataAdapter.
- Read with `cachedRead`, resolve with `getFileByPath` and `getFolderByPath`.
- Wrap constructed paths in `normalizePath()`.
- Leave SessionFileStore on the adapter, and add the line saying why.
- Move the skill and AGENTS.md fixtures in test-support from FakeAdapter onto
  FakeVault.

Exit test: skills still load from a normal vault folder, and an AGENTS.md in a
note's folder chain still reaches the prompt. The `vault/iterate` rule stays
quiet.

## 8. Tighten the Defaults and Reshape the Build

- DEFAULT_SETTINGS ships an empty allow list and search off, which also drops
  the invalid `daily-notes:*` pattern.
- `build` becomes the bundle alone, with no `--sourcemap`.
- `verify` becomes typecheck, test, lint, format, then build.
- Point RELEASE.md step 2 and CONTRIBUTING.md at the new names.

Exit test: a fresh vault runs no command and searches nothing until the
checkboxes are ticked. `bun run build` writes a main.js with no
sourceMappingURL comment and rewrites no source file.

## 9. Name the Copyright Holder, and Sweep the Prose

Paperwork, and the last of the rename.

- Add Ilya's copyright notice above the AGPL text in LICENSE.md.
- Rewrite the README for someone installing from the directory: what it is, the
  key it needs, then how to use it. Development and releasing move to
  CONTRIBUTING.md or below the fold.
- Correct the allow-list examples: `daily-notes` for an id,
  `open-or-create-file-command:*` for a pattern. Remove every mention of
  `daily-notes:*`, which is invalid and misleading.
- Sweep the remaining Owl mentions across docs, README and AGENTS.md.

Exit test: `validate-license` passes. Read the README as someone who has just
installed from the directory and never seen the repo.

## 10. Add the Release Workflow

Last, because it changes no plugin behaviour and the listing goes live without
it.

- Add .github/workflows/release.yml, triggered on a tag matching the manifest
  version.
- Run the same `build` the scanner runs.
- Attach main.js, manifest.json and styles.css, attested with
  `actions/attest-build-provenance` and `id-token: write`.

Exit test: a tag produces a release whose three assets carry attestations, and
`gh attestation verify main.js` passes.

## Before Submitting

Not commits. The things to do once, by hand.

- Rotate the Mistral key that sits in the working tree's data.json.
- Cut a release whose tag matches the manifest version.
- Confirm the manifest on the default branch is the one the directory reads.
- Submit at community.obsidian.md with the GitHub account linked, the owner set
  to Ilya, and the payment category set to Optional payment.
- Read the scan result in the dashboard, which arrives within minutes, and fix
  what it raises before the 24 hours that puts the listing in the app.
