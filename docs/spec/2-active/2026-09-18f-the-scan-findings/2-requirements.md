---
created: 2026-09-18
updated: 2026-09-18
---

# The Scan Findings

## Motivation

The listing was submitted on 2026-09-18 against release 0.5.0, commit 82a88af, and the automated review came back with two errors, six warnings and two recommendations. The listing is pending on them.

Only three findings are about code that ships. The rest are in test support, in a dependency, or are disclosures the dashboard asks for rather than defects. Sorting them that way is most of the work, because a warning about a file the bundle never includes costs nothing to leave and something to chase.

## In Scope

### The description names Obsidian

The rule: a plugin description must not contain the word "Obsidian", because the directory is the context. The manifest reads "Talk to your Obsidian notes."

The word has to come out of manifest.json, and the same string is in package.json and the directory entry, which the scan compares against each other. The repo's GitHub description carries it too and is not read by the scan, so it can stay or go as a matter of taste.

### A script element is created at runtime

Reported as an error, and the most alarming of them, but it is not Tyto's code: no source file under src creates one. It is React DOM's resource-preloading path, which arrives through react-dom/client and sits in the bundle unreached, since nothing calls preinit or preloadModule.

The finding is about the bundle rather than the source, so the fix is to stop shipping the dead path or to answer the finding. Both are in scope; the decision is D1.

### The build does not reproduce

The scan rebuilt from source and got a main.js differing from the released asset. Reproduced locally: a second local build is byte-identical to the first, so the build is deterministic, and it differs from the release.

The cause is the bundler version. build.yml pins `bun-version: latest`, so CI builds with whatever Bun shipped that day, while a local build uses whatever is installed. bun.lock is committed, so the dependencies are already pinned and only the bundler floats.

### An unsafe call at SessionPanel.tsx:126

`TranscriptDocument.write(transcriptOf(state.entries))` is reported as an unsafe call for argument 0. The port is typed, so the looseness is in what the type-aware rule can see through the callback, and the fix is a signature rather than a behaviour change.

### The disclosures the dashboard asks for

Two recommendations, both accurate, and neither a defect:

- Vault enumeration, from getMarkdownFiles in the search tools. The plugin reads every path in the vault to answer a question.
- Clipboard access, from the copy controls in the panel and the transcript.

The audit for the earlier spec flagged clipboard by name as something a real scan raises. Both belong in the dashboard's capability fields, and both are already described in the README's What Leaves Your Vault section.

## Out of Scope

The `this: void` warnings, the TFile and TFolder cast warnings, and the vitest advisory. Each is real and none ships.

- The eighteen `this: void` sites are a style rule about method shorthand. The repo already moved its port and props callbacks to properties for this reason when it adopted the scanner's linter; what is left is static methods passed to map, where the unintended `this` the rule guards against cannot arise.
- Every TFile and TFolder cast is in src/test-support, which the bundle does not contain. Verified: the string test-support appears in main.js zero times.
- vitest is a dev dependency and vite arrives through it. Neither is in the bundle, so the advisory describes the test runner rather than the plugin.

The `:has` selector at styles.css:152 is deliberate and stays. It styles a rendered-markdown entry, the alternative is a class the renderer would have to set, and one selector over a handful of panel rows is not the invalidation case the warning describes.

## References

### Task

- [docs/spec/3-archived/2026-09-11b-community-plugin-submission/2-audit/6-the-new-process.md](../../3-archived/2026-09-11b-community-plugin-submission/2-audit/6-the-new-process.md) - open first: what the scan reads and the dashboard fields, including the clipboard capability this scan raised
- manifest.json and package.json - the description in both, plus the directory entry the scan compares them against
- .github/workflows/build.yml - the `bun-version: latest` pin that makes the build unreproducible
- src/session/views/SessionPanel.tsx - the unsafe call, at line 126

### Project

- [docs/spec/2-active/2026-09-18e-submission-readiness/1-index.md](../2026-09-18e-submission-readiness/1-index.md) - the spec that got the plugin submitted, whose last item this continues from
