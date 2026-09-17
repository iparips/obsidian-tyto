---
created: 2026-09-17
updated: 2026-09-17
---

# The Automated Review, and What It Runs

The directory no longer takes a pull request against a plugin list. Submission
happens in a dashboard, and every release is scanned, not only the first. The
scan reports in four sections, each finding an error, a warning, a
recommendation or a pass.

| Section            | What it reads                                      |
| ------------------ | -------------------------------------------------- |
| Manifest           | manifest.json on the default branch                |
| Releases           | the release assets, and their attestations         |
| Source code        | the repo, through Obsidian's own ESLint plugin     |
| Build verification | a rebuild from source, compared to the shipped one |

## Run the Linter Before Submitting

eslint-plugin-obsidianmd is the guidelines encoded as rules, and it is what the
source-code section runs. It is now a dev dependency, ESLint is 9, and
eslint.config.mjs replaces the legacy .eslintrc. This turned the audit from a
reading of the docs into something the build checks, and it keeps checking
after the submission lands.

`bun run lint` reports no errors. Two warnings remain: the settings-tab rule,
which the settings work clears, and fetch in the Mistral provider, which no
commit here owns.

Two warnings the linter raised first are already gone, and they are worth
recording because this design first read them as a settings-search concern.
The plugin called two APIs newer than the 1.5.0 it declared, and one of them
crashed.

Notice.messageEl arrived in 1.8.7, replacing noticeEl. Below that version the
property is undefined, so every notice the plugin shows throws a TypeError.

revealLeaf is milder. It predates 1.7.2, which added the promise that makes
awaiting it guarantee an undeferred view. Below that the await resolves
immediately, and the leaf's view may not be the session's yet.

minAppVersion is now 1.13.0, which clears both. It landed on main rather than
in the settings work, because the deferred-views spec needs the same floor.
Nothing has shipped, so no install was on an affected version.

Rules worth naming, each mapping to a finding this spec carries:
`settings-tab/prefer-setting-definitions`, `validate-license`,
`validate-manifest`, `vault/iterate` and `ui/sentence-case`.

The preset also enables type-aware TypeScript rules the repo had not run. The
config keeps them, switching off in test code the handful that only describe
test doubles: `vi.fn()` is `any` by construction, and a parked promise left
unsettled is often the case under test.

## Build Verification Runs `build`

The scanner rebuilds the plugin and compares the result to the shipped main.js.
It takes the first script it finds named `build`, `build:plugin` or `compile`.

This kills the `build:release` script the smaller-changes design proposed. A
script the scanner never calls cannot be where the release settings live, so
`--sourcemap` comes out of `build` itself.

The current `build` is also the wrong shape for an entry point. It runs
typecheck, the suite, the linter and prettier `--write` before bundling, so it
rewrites files and can fail on a lint nit unrelated to the bundle.

```json
"build": "bun build src/main.ts --outdir . --entry-naming \"[name].[ext]\" --external obsidian --format cjs",
"verify": "bun run typecheck && bun run test && bun run lint && bun run format && bun run build"
```

`build` becomes the bundle alone, which is what the scanner wants and what the
release needs. `verify` is what a person runs, and what the docs point at. The
sourcemap stays available through `bun build --sourcemap` on the command line.

## The LICENSE Needs a Copyright Line

`validate-license` checks the structure of the copyright notice. LICENSE.md is
the unmodified AGPL text, so its only copyright is the Free Software
Foundation's 2007 line covering the licence document, and the instantiation
template still reads `Copyright (C) <year> <name of author>`. Nothing says who
owns Tyto. Add the notice above the licence text:

```
Copyright (C) 2026 Ilya Paripsa

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

The AGPL body below it is untouched.

## Artifact Attestations

The releases section recommends GitHub artifact attestations for main.js,
manifest.json and styles.css. A recommendation rather than an error, so it does
not gate the listing, and the blog post names attestation as feeding the
scorecards the directory is building.

The release is cut by hand today and the repo has no workflow at all, so a
workflow buys two things: the attestations, and a build that is not a laptop.

- Add .github/workflows/release.yml, triggered on a tag matching the manifest
  version.
- Run the same `build` the scanner runs, so the two agree by construction.
- Attach main.js, manifest.json and styles.css, with
  `actions/attest-build-provenance` and `id-token: write` permission.

Deliberately last in the task list. It changes no plugin behaviour, and the
listing goes live without it.

## What the Dashboard Asks For

Filled in once, by hand, and not derivable from the repo.

Payment category

- Free, Optional payment, or Paid. Optional payment covers a plugin whose full
  use needs a paid third-party service, which is what a Mistral key is.

Capability disclosures

- Network, filesystem and clipboard access, read off the README section that
  [3-disclosures.md](3-disclosures.md) specifies. The clipboard is the one the
  scanner raises by name, so the disclosure says clipboard rather than only
  naming the transcript.

The owner is the submitting account, so the entry is created under Ilya's own
GitHub account rather than an organisation.
