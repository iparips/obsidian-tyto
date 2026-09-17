---
created: 2026-09-11
updated: 2026-09-17
---

# Community Plugin Submission: Spec

Brings the plugin in line with the Obsidian community directory's rules before
it is submitted, and renames it from Owl to Tyto on the way through.

Submission is a dashboard at community.obsidian.md, and an automated scan reads
every release rather than only the first. The scanner is the reviewer, so the
work is passing it. The audit found one blocker that stops the listing outright,
and a set of findings the scan otherwise raises.

The blocker is the plugin id. A community plugin id cannot contain the string
"obsidian", and this one's was `obsidian-owl`. Since the id had to change
anyway, the plugin takes the name Tyto outright: a rename before a public
listing costs one migration, and after one costs every user a rebrand.

Nothing here changes what the plugin does. Every item is packaging, disclosure,
naming, or a convention the scan checks.

- [0-prompt.md](0-prompt.md) - the block to paste into a fresh session that will
  build this
- [2-audit/1-index.md](2-audit/1-index.md) - every rule checked, with the
  verdict and the evidence
- [3-requirements.md](3-requirements.md) - what must be true before submitting
- [4-design/1-index.md](4-design/1-index.md) - the scan and what it runs, the
  rename and its migration, the settings tab, and the README disclosures
- [5-tasks.md](5-tasks.md) - build order in ten commits, with an exit test for
  each

## The Shape of the Work

Five groups, in the order they should land.

1. The rename, in two commits: the mechanical sweep, then the settings
   migration that carries an existing install across the new id.
2. The linter the scan runs, which the repo does not have. It re-audits
   everything and turns this spec from a reading of the docs into a gate.
3. The disclosures, because the network use and the API key are what a reader
   opens the README for.
4. The settings tab, which today renders raw React inputs rather than
   Obsidian's declarative settings API, and so matches neither the platform's
   look nor what the scan expects.
5. The rest of what the scan reads: the console, the adapter reads, the
   defaults, the build script its verification calls, the licence's copyright
   line, and the release workflow that attests the assets.

## What the Audit Cleared

Worth stating, because it narrows the work. The plugin already avoids the
failures that usually sink a first submission.

- No `innerHTML`, `outerHTML` or `insertAdjacentHTML` anywhere in the source.
- No global `app` object; every reach goes through `this.app`.
- No Node or Electron API, so `isDesktopOnly: false` is honest and the plugin
  runs on a phone.
- Resources are registered, so they unload cleanly, and no leaf is detached in
  `onunload`.
- No default hotkey, and the command id carries no plugin prefix.
- Styling lives in styles.css against Obsidian's CSS variables, with no
  hardcoded colour and no inline style in the source.
- Source is public and AGPL, which the directory now requires rather than
  merely permits.
