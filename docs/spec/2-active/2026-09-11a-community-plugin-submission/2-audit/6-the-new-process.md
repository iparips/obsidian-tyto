---
created: 2026-09-17
updated: 2026-09-17
---

# Findings From the Process Change, and One Defect

The rest of this audit was written against a submission by pull request against
a plugin list, reviewed by a person. That process is gone. Submission is a
dashboard at community.obsidian.md, and an automated scan reads every release.

Six findings follow from that, none of which the earlier passes could have
caught. Design in
[../4-design/6-the-automated-review.md](../4-design/6-the-automated-review.md).

A seventh, finding 19, is a plain defect found on the way.

## 13. The Repo Does Not Run the Scanner's Linter

eslint-plugin-obsidianmd is the guidelines as ESLint rules, and the scan's
source-code section runs it. The repo's .eslintrc carries TypeScript rules only,
so every guideline in this audit was checked by hand against the docs.

- Evidence: .eslintrc names no Obsidian rule; package.json has no
  eslint-plugin-obsidianmd.
- Severity: not a finding the scan reports. It is the one that would have found
  the others, which is why it leads the task order.

## 14. The Settings Tab Needs getSettingDefinitions()

Obsidian 1.13 added a declarative settings API, and the scanner warns on a
`PluginSettingTab` (Obsidian) that does not implement it. The spec's original
settings design targeted the imperative builder chain, which would have landed
the rewrite already flagged.

- Rule: `settings-tab/prefer-setting-definitions`, seen on a real scan of another
  plugin worded "PluginSettingTab does not implement getSettingDefinitions()".
- Knock-on: the API needs minAppVersion 1.13.0, and the manifest says 1.5.0.

## 15. The LICENSE Carries No Copyright Notice

LICENSE.md is the AGPL text as published, so its only copyright is the Free
Software Foundation's, covering the licence document itself. The instantiation
template near the end still reads `Copyright (C) <year> <name of author>`.

- Rule: `validate-license`, which checks the copyright notice's structure.
- Evidence: no line in the file names Ilya.

## 16. Build Verification Runs `build`, Which Is Not the Release Build

The scan rebuilds from source and compares against the shipped main.js, using
the first script named `build`, `build:plugin` or `compile`.

Two consequences.

- The `build:release` script the spec proposed is never called, so finding 12's
  dangling sourcemap survives the fix.
- `bun run build` runs typecheck, the suite, the linter and prettier `--write`
  before bundling. A verification entry point that rewrites files and fails on
  an unrelated lint nit is the wrong shape.

## 17. No Release Workflow, So No Artifact Attestations

The releases section recommends GitHub artifact attestations for main.js,
manifest.json and styles.css. The repo has no .github directory, so releases are
cut by hand and nothing is attested. A recommendation, not an error, so it does
not gate the listing.

## 18. The Dashboard Fields Are Not Answered Anywhere

Submission asks for two things the repo cannot answer.

- Payment: Free, Optional payment, or Paid. A plugin needing a paid third-party
  key is Optional payment.
- Capabilities: network, filesystem and clipboard. Clipboard is raised by name in
  a real scan, which finding 4 treated as a README nicety rather than a category.

## 19. The Daily-Notes Default Never Worked

Not a guideline, found while re-reading the defaults for finding 9. The shipped
default and both user-facing explanations use `daily-notes:*` as the way to allow
the daily note. It does not allow it.

The core command's id is `daily-notes`, with no colon. AllowList (Tyto) treats a
trailing wildcard as a prefix match, so `daily-notes:*` needs the colon present
and matches only namespaced siblings such as `daily-notes:goto-prev`. The one
command a user wants, "Open today's daily note", is the one it misses.

- Evidence: AllowList.matches does `commandId.startsWith(entry.slice(0, -1))`,
  and the CommandPicker (Tyto) test registers the core command as `daily-notes`.
  The code's own comment says it: "Obsidian's core commands are not namespaced at
  all."
- Fix, in the default: none needed. Finding 9 empties the allow list, so the
  broken pattern goes with it.
- Fix, in the prose: it comes out of the README and the allow-list note in the
  settings text. Invalid rather than merely unhelpful, so it misleads a reader
  into writing an entry that silently matches nothing. That note is copied into
  the rewritten tab's `desc`, so a rewrite carries the error forward.

Replacements, both already used in the repo's own tests:

| Kind             | Example                        |
| ---------------- | ------------------------------ |
| A command id     | daily-notes                    |
| A namespace      | open-or-create-file-command:*  |

AllowedEntries' test pairs exactly these two, so the tests were right where the
docs and the default were wrong.

## Two Passes Confirmed Under the New Rules

Listed as clean in [5-passes.md](5-passes.md) and still are, but the new process
gives them a sharper reason.

- Closed-source plugins are no longer accepted at all. The repo is public and
  AGPL, so the licence choice that was merely permitted is now required.
- A project the scan finds unmaintained is eventually removed. Every release
  being scanned means the listing is a standing obligation rather than a
  one-time gate.
