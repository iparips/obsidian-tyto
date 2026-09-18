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
- Match the directory entry in the obsidian-releases fork, since the scan compares the two and a fix in one is a mismatch in the other.

Exit test: the word appears in neither manifest.json nor package.json, and the three descriptions are byte-identical.

## 2. Pin the Bundler So the Build Reproduces

Owned by D2, which is open on how far to go.

- Replace `bun-version: latest` in build.yml with the exact version, so two runs of the same commit produce the same bundle.
- Say that version in docs/CONTRIBUTING.md, so a contributor knows which Bun reproduces a release.

Exit test: two CI runs of one commit produce the same main.js, and a local build on the pinned version matches the released asset.

## 3. Type the Transcript Callback

- Give the transcriptOf port a signature the type-aware rule can see through, so SessionPanel.tsx:126 is no longer an unsafe call.
- Behaviour does not move. The document is still built at the click rather than per render.

Exit test: the scanner's rule is quiet on that line, and the transcript still copies.

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
