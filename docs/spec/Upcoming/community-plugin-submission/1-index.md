---
created: 2026-09-11
updated: 2026-09-11
---

# Community Plugin Submission: Spec

Brings the plugin in line with the Obsidian community directory's rules before
the listing PR is raised, and renames it from Owl to Tyto on the way through.
The audit found one blocker that stops the submission outright, and a set of
review comments that a reviewer will otherwise raise.

The blocker is the plugin id. A community plugin id cannot contain the string
"obsidian", and this one's is `obsidian-owl`. Since the id must change anyway,
the plugin takes the name Tyto outright: a rename before a public listing costs
one migration, and after one costs every user a rebrand.

Nothing here changes what the plugin does. Every item is packaging,
disclosure, naming, or a convention the reviewer checks.

- [2-audit/1-index.md](2-audit/1-index.md) - every rule checked, with the
  verdict and the evidence
- [3-requirements.md](3-requirements.md) - what must be true before the PR is
  raised
- [4-design/1-index.md](4-design/1-index.md) - the rename and its migration,
  the settings tab rewrite, and the README disclosures
- [5-tasks.md](5-tasks.md) - build order in seven commits, with an exit test
  for each

## The Shape of the Work

Four groups, in the order they should land.

1. The rename, in two commits: the mechanical sweep, then the settings
   migration that carries an existing install across the new id.
2. The disclosures, because the network use and the API key are what a reviewer
   reads the README for.
3. The settings tab, which today renders raw React inputs rather than
   Obsidian's Setting API, and so matches neither the platform's look nor its
   UI-text rules.
4. The small review comments: console logging, the adapter reads, the
   defaults that reach for the vault before the user has asked.

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
