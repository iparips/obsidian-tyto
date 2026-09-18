---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Order

Three commits, then a release and a reply. The commits are independent, so any can land alone.

## 1. Take Obsidian Out of the Description

The only error that is plainly Tyto's, and the cheapest to fix.

- Drop the word from manifest.json. "Talk to your notes. Edit text, format structure, and ask questions about what's in them." keeps the sentence and loses the word.
- Match package.json, which carries the same string.
- Check the listing's own description in the dashboard, under Edit listing. The directory is no longer a file in a repository, so there is no entry to edit in a fork: submission is the dashboard, and community-plugins.json is generated from it.

Exit test: the word appears in neither manifest.json nor package.json, and the listing's description matches the manifest's.

## 2. Pin the Bundler So the Build Reproduces (done)

D2 resolved on both halves. build.yml pins 1.3.13 rather than latest, and the prerequisites in docs/CONTRIBUTING.md name the same version and say why.

Also done here, and not a finding: `build` is now the release bundle, minified and with React in production mode, which is 410 KB against 1.36 MB. `build:dev` is the same bundle unminified, and `verify` and `./install` both use it, because an installed build is one being debugged and a minified stack trace names nothing. CI and the scan both call `build`, so what a release ships is what a rebuild produces.

The size change also answers two thirds of the script-element finding: the production define drops React's development build, and with it two of the three sites.

Exit test: two CI runs of one commit produce the same main.js, and a local build on the pinned version matches the released asset.

## 3. Type the Transcript Callback (blocked: cannot reproduce)

The finding does not reproduce locally, and nothing on that line is untyped.

- `transcriptOf` is declared `(entries: readonly PanelItem[]) => TranscriptSource`.
- `TranscriptDocument.write` takes a `TranscriptSource` and returns a string.
- `TranscriptSource` is a class with seven readonly properties, none of them `any`.
- The repo's own lint is clean on the file, and `no-unsafe-argument` is switched off only under `**/tests/**` and `src/test-support/**`, so this file is checked.
- Running `strictTypeChecked` with `no-unsafe-argument` forced on reports nothing there either.

So there is no change to make from here that can be shown to fix it. Ask the review what its rule saw: it may be resolving types differently, or reporting against the bundled line rather than the source one. D3 owns it.

Exit test: none until the finding can be reproduced. Do not change the signature on a guess: a type widened to silence a rule nobody can trigger is a change that cannot be verified and will not be understood later.

## Before Re-scanning

Not commits.

### Answer the two capability recommendations

In the dashboard, declare what the plugin reaches:

- Vault enumeration: it reads every note path to answer a question from search.
- Clipboard: the panel's copy controls and the transcript.
- Network, which the payment field's explanation already covers: speech and note text go to Mistral.

### Fill the payment explanation

Optional payment, because the key is the user's and the money goes to Mistral rather than to the author. Say that the plugin charges nothing, that the key is created at console.mistral.ai, and that the donate link unlocks nothing.

### Reply about the script element

Per D1, answer the review rather than rebuilding the panel: the finding is React DOM's preloading path, which no Tyto code reaches. Name the file and the library. Do this before cutting the release, since the reply may settle whether anything has to change.

### Cut a release and re-scan

The scan reads a release rather than the branch, so the fixes need one. docs/RELEASE.md owns the steps, and the description has to match in the release's manifest.json, in package.json and in the directory entry.
