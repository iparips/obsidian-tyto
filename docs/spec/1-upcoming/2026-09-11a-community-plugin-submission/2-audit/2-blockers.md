---
created: 2026-09-11
updated: 2026-09-11
---

# Blockers

A blocker fails the automated review, so the listing cannot go live until it is
fixed.

## 1. The plugin id contains "obsidian"

The directory rejects an id containing the string. Owl's manifest carries
`obsidian-owl`.

- Rule: "The `id` must be unique across all published plugins and can't contain
  `obsidian`." (Submit your plugin, step 3)
- Evidence: manifest.json line 2.
- Fix: rename to `tyto`. Design in
  [../4-design/2-id-and-migration.md](../4-design/2-id-and-migration.md).

The repository name may keep the `obsidian-` prefix. Only the manifest id is
constrained, so no link to the repo breaks.
