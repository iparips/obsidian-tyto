---
created: 2026-09-11
updated: 2026-09-11
---

# Passes, and Two Findings That Are Not Guidelines

## Checked and Clean

No action. Worth listing, because it narrows the work: Owl already avoids the
failures that usually sink a first submission.

| Rule                                        | Evidence                                                           |
| ------------------------------------------- | ------------------------------------------------------------------ |
| No innerHTML, outerHTML, insertAdjacentHTML | No occurrence in src                                               |
| No global app or window.app                 | Every reach is this.app                                            |
| Code organised into folders                 | src splits into nine concept packages                              |
| No placeholder class names                  | OwlPlugin, OwlSettings, OwlSettingsTab                             |
| No Node or Electron API                     | No fs, path, os, crypto or electron import; isDesktopOnly is false |
| Resources cleaned up on unload              | registerView, registerEvent, registerDomEvent in main.ts           |
| No leaf detached in onunload                | No onunload; no detachLeavesOfType                                 |
| No default hotkey                           | addCommand carries no hotkeys key                                  |
| Command id carries no plugin prefix         | id is start-session                                                |
| No custom view reference held               | registerView returns a new SessionView per call                    |
| Editor API used for note edits              | NoteEditor edits through the editor, not Vault.modify              |
| getAbstractFileByPath over iteration        | src/search/note-reader.ts line 10                                  |
| No hardcoded styling in code                | No inline style; 104 uses of Obsidian CSS variables in styles.css  |
| const and let, no var                       | No var in src                                                      |
| async and await over promise chains         | Throughout                                                         |
| LICENSE present                             | LICENSE.md, AGPL-3.0-or-later                                      |
| README present and explains use             | README.md                                                          |
| minAppVersion set                           | 1.5.0                                                              |
| No fundingUrl                               | Absent from the manifest, correctly                                |
| No sample code                              | None remains                                                       |
| Version is semver                           | 0.1.0, matching versions.json                                      |
| No obfuscated code                          | Bundle is unminified and readable                                  |
| No self-update or dependency install        | None                                                               |
| No ads, no client-side telemetry            | The only network call is the provider                              |
| Not a fork                                  | Original work                                                      |
| Trademark respected                         | Plugin is named Owl, not an Obsidian-branded name                  |

## 11. A Live API Key Sits in the Working Tree

data.json holds a real Mistral key. The file is gitignored and `git ls-files`
confirms it was never committed, so the repository is clean. The key is still
on disk in a folder that is about to get public attention.

- Action: rotate the key in the Mistral console, and keep the local file out of
  any archive or screenshot attached to the PR.

## 12. The Bundle Ships a Source Map Reference

main.js ends with a `sourceMappingURL` comment pointing at main.js.map. The map
is gitignored and will not be a release asset, so Obsidian's console fails to
resolve it.

- Action: drop `--sourcemap` from the release build. It also takes 1.3 MB of
  bundle down, since React is bundled unminified.
