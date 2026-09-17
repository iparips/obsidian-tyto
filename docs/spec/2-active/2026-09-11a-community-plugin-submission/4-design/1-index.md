---
created: 2026-09-11
updated: 2026-09-17
---

# Design

How each audit finding is fixed. Grouped by what the change touches, not by
finding number.

- [2-id-and-migration.md](2-id-and-migration.md) - the id rename, and carrying
  an existing install's settings across it
- [3-disclosures.md](3-disclosures.md) - what the README section says
- [4-settings-tab.md](4-settings-tab.md) - the tab rebuilt on the declarative
  settings API, and the minAppVersion bump it needs
- [5-smaller-changes.md](5-smaller-changes.md) - logging, vault reads, path
  normalisation, and defaults
- [6-the-automated-review.md](6-the-automated-review.md) - the scanner that is
  now the reviewer: its linter, its build verification, the licence, the
  attestations, and the dashboard fields

Read [6-the-automated-review.md](6-the-automated-review.md) first. It describes
the thing that judges the submission, and two of the other files changed
because of what it runs.

The rename is the only change with a migration cost, so it leads. Everything
else is independent and can land in any order.
