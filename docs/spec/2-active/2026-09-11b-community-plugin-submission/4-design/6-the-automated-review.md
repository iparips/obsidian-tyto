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
source-code section runs. The repo does not have it: .eslintrc is a legacy
config carrying TypeScript rules and nothing of Obsidian's.

Installing it turns the audit from a reading of the docs into something the
build checks, which keeps checking after the submission lands.

- Install eslint-plugin-obsidianmd as a dev dependency, and raise ESLint from 8
  to 9. The recommended preset ships as flat config, which 8 does not read.
- Replace .eslintrc with eslint.config.mjs.
- Fix what it reports, and keep `bun run lint` as the gate.

Two rules will disagree with the repo, both correctly. `no-unsupported-api`
reads manifest.json's minAppVersion, which says 1.5.0 while the obsidian
devDependency resolves to 1.13.1; the settings work raises it to 1.13.0 anyway.
The settings-tab rules are the other, and they go quiet when that work lands.

Rules worth naming, each mapping to a finding this spec carries:
`settings-tab/prefer-setting-definitions`, `validate-license`,
`validate-manifest`, `vault/iterate` and `ui/sentence-case`.

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
