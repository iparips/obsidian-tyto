---
created: 2026-09-18
updated: 2026-09-18
---

# The Scan Findings: Spec

Clears the automated review that came back on the submission. Ten findings against release 0.5.0, commit 82a88af, and the listing is pending on them.

Three are about code that ships. The rest are in test support, in a dev dependency, or are disclosures the dashboard asks for rather than defects, and the spec says why each is left rather than leaving a reader to work it out.

- [2-requirements.md](2-requirements.md) - each finding, what it is really about, and the ones that are out of scope
- [3-decisions.md](3-decisions.md) - D1 the script element, which blocks, and D2 how far the build has to reproduce
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - four checks, ending at the listing going live
- [5-tasks.md](5-tasks.md) - three commits, then the dashboard fields, the reply and a release

## What the Findings Are Really About

Two errors, six warnings, two recommendations. Sorted by whether the bundle contains the code.

| Finding                     | Ships | Verdict                                   |
| --------------------------- | ----- | ----------------------------------------- |
| Description names Obsidian  | yes   | Fix: one word, in three places            |
| Script element at runtime   | yes   | D1: React DOM's, unreached                |
| Build does not reproduce    | yes   | Fix: pin the bundler version              |
| Unsafe call in SessionPanel | yes   | Fix: a signature                          |
| Vault enumeration           | yes   | Disclose: it is what search does          |
| Clipboard access            | yes   | Disclose: the copy controls               |
| this: void, eighteen sites  | yes   | Leave: static methods, no this to capture |
| TFile and TFolder casts     | no    | Leave: every site is in test-support      |
| vitest advisory             | no    | Leave: a dev dependency                   |
| :has selector               | yes   | Leave: deliberate, and a handful of rows  |

## The One That Reads Worse Than It Is

The script-element error names dynamically injecting script elements, which is how a plugin would load arbitrary external code. Tyto creates none: the string appears nowhere under src, and the three sites in main.js are React DOM's resource preloading, reached through preinit and preloadModule, which the plugin never calls.

It is still an error on the report, and errors gate a listing where warnings do not. D1 owns what to do about it, and the cheapest answer is a reply rather than a rewrite.
