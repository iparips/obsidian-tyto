---
created: 2026-09-18
updated: 2026-09-18
---

# Submission Readiness

## Motivation

The community-plugin-submission spec landed all ten of its commits, and the automated scan's gate is green: lint reports nothing, typecheck passes, and the suite is 1504 tests across 112 files. Its own closing section left four things to do by hand, and none of them has happened. There are no tags, no releases, and ten unpushed commits on main.

A re-audit against the current tree also found three regressions and gaps that the earlier spec cannot have caught, because two of them arrived in work that shipped after it closed. None changes what the plugin does; all are packaging or hygiene the scan or a reader sees.

The plugin is close. This spec is the short list between here and a submitted listing.

## In Scope

### Two console.debug calls returned

The submission spec's commit 5 removed all eight console.debug calls, and its exit test was a full turn printing nothing. Two are back, both in WorkspaceNoteLocator (engine/note-binding):

- workspace-note-locator.ts:66, on loading a deferred leaf
- workspace-note-locator.ts:70, when no leaf holds the path

They arrived with the deferred-views work, in commits eed9e13 and a0bd647, after the submission spec closed. The linter does not catch them, so only a reading finds them. Remove both, keeping the surrounding control flow unchanged.

### The GitHub repo carries no description and no topics

The directory's reviewers and its readers both land on the repo page. It has an empty description and no topics. Set the description to the manifest's, and add the topics the directory conventionally reads: obsidian, obsidian-plugin, obsidian-md.

### GitHub cannot identify the licence

`gh repo view` reports the licence as "Other". The file is LICENSE.md, holding the full AGPL text under Ilya's copyright line. GitHub reads that filename, so the likelier cause is the copyright line sitting above the licence body, ahead of the text the detector expects to match first. Make the licence detectable so the repo page shows AGPL-3.0, without weakening the notice. D1 owns which way.

### No release exists

The manifest says 0.1.0 and versions.json maps it to 1.13.0, but the repository has no tags and no releases. The directory reads a release's assets, so there is nothing for it to read. Ten commits are also unpushed, so the default branch GitHub serves is not the tree that was just verified.

This is the hand-run sequence docs/RELEASE.md already describes. It is in scope as a checklist to run, not as code to write.

### The submission itself

The four items the earlier spec parked, unchanged: cut the release, confirm the manifest on the default branch, submit at community.obsidian.md with the owner set to Ilya and the payment category set to Optional payment, then read the scan result and fix what it raises.

## Out of Scope

Rotating the Mistral API key. The earlier spec established that data.json is gitignored and was never committed, so nothing leaked. That holds in the current tree: data.json is untracked and the ignore rule names it.

Re-auditing the rules the earlier spec already cleared. Its audit folder holds the evidence, and this re-read confirmed the checkable ones still pass: no innerHTML anywhere in src, no sourcemap comment in the bundle, build rewrites no source file, and the settings tab implements getSettingDefinitions rather than display.

## References

### Task

- [docs/spec/3-archived/2026-09-11b-community-plugin-submission/1-index.md](../../3-archived/2026-09-11b-community-plugin-submission/1-index.md) - open first: the audit, the design and the ten commits this spec continues from
- [docs/spec/3-archived/2026-09-11b-community-plugin-submission/5-tasks.md](../../3-archived/2026-09-11b-community-plugin-submission/5-tasks.md) - its Before Submitting section, which is the unfinished half of this work
- src/engine/note-binding/workspace-note-locator.ts - the two console.debug calls, at lines 66 and 70
- docs/RELEASE.md - the six-step release ritual the release task runs

### Project

- [docs/spec/3-archived/2026-09-11b-community-plugin-submission/2-audit/6-the-new-process.md](../../3-archived/2026-09-11b-community-plugin-submission/2-audit/6-the-new-process.md) - open when filling the submission dashboard: the payment categories and what the scan does after submitting
