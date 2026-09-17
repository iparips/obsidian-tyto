---
created: 2026-09-11
updated: 2026-09-17
---

# Implementation Order

Ten commits. Each leaves the suite green and the plugin loadable, so the order
can stop at any point without a half-migrated vault.

All ten have landed. Commits 1 and 2 shipped to main before this spec was split
across two sessions; 3 to 10 are on the community-plugin-submission branch.
What remains is [Before Submitting](#before-submitting), which is done by hand.

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

## 2. Adopt the Scanner's Linter (done)

Landed on main before this spec was split across two sessions, because it is
the gate the other eight commits land against.

eslint-plugin-obsidianmd is a dev dependency, ESLint is 9, and eslint.config.mjs
replaces .eslintrc. `bun run lint` reports no errors.

Two warnings remain: the settings-tab rule, which commit 6 owns as this spec
expected, and `fetch` in the Mistral provider, which is the fourth finding
below.

The preset also turns on type-aware TypeScript rules. Most of what they found
had one cause: a callback declared as a method shorthand carries a `this`
context. The port and props interfaces now declare callbacks as properties.

### Four Findings the Audit Missed

The first two are the same bug, and one of them crashes. Both are calls to an
API newer than the 1.5.0 the manifest declared.

- Notice.messageEl arrived in 1.8.7, replacing noticeEl. Below that version the
  property is undefined, so turn-notices.ts:46 throws a TypeError on every
  notice it shows, which is every turn the panel is not visible.
- revealLeaf is milder. It predates 1.7.2; what that version added was the
  promise, so awaiting it guarantees the view is no longer deferred. Below it
  the await at session-leaf.ts:16 resolves immediately, so the next line can
  read a view that is not a SessionView yet and reveal returns null. Same
  failure the deferred-views spec covers.

Raising minAppVersion to 1.13.0 clears both, and it has landed on main rather
than waiting for commit 6: the deferred-views spec needs the same floor, and
two parallel sessions editing manifest.json would conflict. This spec had
framed the bump as a settings-search concern rather than a bug. Nothing has
shipped, so no install was on an affected version.

The third was fixed in commit 2 rather than deferred:

- Two clipboard handlers dropped a rejection and claimed "Copied" when nothing
  was copied.

The fourth is answered rather than fixed:

- `no-restricted-globals` wants requestUrl rather than fetch for network calls,
  which the Mistral provider uses. RequestUrlParam carries no AbortSignal, and
  the signal is what makes cancelling a turn stop the request rather than wait
  for the model to finish. requestUrl exists to bypass CORS, and api.mistral.ai
  answers a preflight with `access-control-allow-origin: *`, so there is no
  CORS to bypass. The rule is switched off for that one file, with the
  reasoning in eslint.config.mjs and beside the call.

## 3. Migrate Settings Across the Id Change (done)

The blocker's real cost, and the only task that touches a user's stored data.

- Add LegacySettingsMigration (Tyto, new) under settings/, reading the legacy
  path through the adapter and writing through the plugin's saveData.
- Call it from `onload`, in place of the current `loadData` spread.
- Teach the installer to remove a stale `obsidian-owl` folder, but only once the
  new id holds a data.json. Finding 20: the installer runs before the plugin's
  next load, so an unconditional removal deletes what the migration reads.

Exit test: install over a vault holding an Owl-era config, confirm the API key
and allow list survive, and that a second install removes the old plugin folder.
Then install into a clean vault and confirm the defaults load with nothing
logged.

## 4. Disclose Network Use in the README (done)

No code. Do it before the settings work, so a half-finished branch still
carries the disclosure the policies require.

- Add the disclosure section after "What it does not do".
- Cover the service, what is sent, when, why, the account, the clipboard, and
  what never leaves.

Exit test: read it as a stranger and answer "what leaves my vault, and to
whom" without opening another file. Search it for "clipboard" and find it.

## 5. Silence the Console (done)

Small and isolated.

- Remove all eight `console.debug` calls.
- Keep the surrounding catch blocks and their behaviour.

Exit test: run a full turn with the console at default level and see nothing
printed.

## 6. Rebuild the Settings Tab (done)

The largest task, and the one the scan comments on today.

- minAppVersion is already 1.13.0, mapped in versions.json. It landed on main
  ahead of this work, because the deferred-views spec needs the same floor.
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

## 7. Move Vault Reads Off the Adapter (done)

- AgentsMdRepository and SkillRepository take Vault rather than DataAdapter.
- Read with `cachedRead`, resolve with `getFileByPath` and `getFolderByPath`.
- Wrap constructed paths in `normalizePath()`.
- Leave SessionFileStore on the adapter, and add the line saying why.
- Move the skill and AGENTS.md fixtures in test-support from FakeAdapter onto
  FakeVault.

Exit test: skills still load from a normal vault folder, and an AGENTS.md in a
note's folder chain still reaches the prompt. The `vault/iterate` rule stays
quiet.

Two tests changed, because the Vault API is not the adapter and the design did
not say so.

- A miss no longer records a read. getFileByPath returns null before cachedRead
  is reached, where the adapter attempted the read and threw. The
  sibling-folder test asserted a missing file's read, so it now gives the
  sibling a file and asserts that one.
- The vanishing-skill fixture has to keep valid frontmatter. Without it the
  skill never lists, and the failure reads as absent rather than unreadable,
  which is a different branch.

## 8. Tighten the Defaults and Reshape the Build (done)

- DEFAULT_SETTINGS ships search off, and the allow list holding `daily-notes`
  rather than the invalid `daily-notes:*`. Opening the daily note destroys
  nothing, so it is the one command safe to allow unasked.
- `build` becomes the bundle alone, with no `--sourcemap`.
- `verify` becomes typecheck, test, lint, format, then build.
- Point RELEASE.md step 2 and CONTRIBUTING.md at the new names.

Also `./install --skip-tests`, which named the removed `build:no-tests`. It
selects `build` over `verify` now, which is the same intent under the new names.

Exit test: a fresh vault opens the daily note and searches nothing until the
search toggle is on. `bun run build` writes a main.js with no
sourceMappingURL comment and rewrites no source file.

## 9. Name the Copyright Holder, and Sweep the Prose (done)

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

## 10. Add the Release Workflow (done)

Last, because it changes no plugin behaviour and the listing goes live without
it.

- Add .github/workflows/build.yml, on push, pull request, release created and
  workflow dispatch.
- Run the same `build` the scanner runs, after typecheck, test and lint as
  separate steps.
- Attach main.js, manifest.json and styles.css to a created release, attested
  with `actions/attest-build-provenance` and `id-token: write`.

Exit test: a pull request runs the checks, and publishing a release leaves it
holding three attested assets that `gh attestation verify main.js` passes.

### Shaped After the Plugin Already in the Store

The design proposed a release-only workflow on a tag. It is now modelled on
open-or-create-file-obsidian-plugin's build.yml, which has been running against
a listed plugin, so its shape is proven rather than reasoned.

What that changed, and why each is worth it:

- It is CI as well as release. Running on push and pull request means a red
  build is found on the branch rather than at the tag, which is the larger
  share of the value.
- A release is drafted by hand and the workflow attaches the assets, rather
  than a tag creating the release. It keeps one release ritual across both
  plugins.
- `format` is left out of the run. It rewrites files, which a CI job must not
  do, so the linter is what CI enforces.

Two things it does not copy. The reference runs in a `node:24-alpine` container
and installs Bun by piping curl, which is there because that repo needs a Node
base image; `oven-sh/setup-bun` on a plain runner is fewer moving parts. And it
carries no attestations, which the directory recommends, so those stay.

## Before Submitting

Not commits. The things to do once, by hand.

- Cut a release whose tag matches the manifest version.
- Confirm the manifest on the default branch is the one the directory reads.
- Submit at community.obsidian.md with the GitHub account linked, the owner set
  to Ilya, and the payment category set to Optional payment.
- Read the scan result in the dashboard, which arrives within minutes, and fix
  what it raises before the 24 hours that puts the listing in the app.

Not on this list, though an earlier draft had it: rotating the Mistral key.
data.json is gitignored and was never committed, which
[2-audit/5-passes.md](2-audit/5-passes.md) finding 11 establishes, so nothing
leaked and there is nothing to revoke. Rotating is optional hygiene, not a step
the submission waits on.
