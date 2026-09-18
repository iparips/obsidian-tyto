---
created: 2026-09-18
updated: 2026-09-18
---

# Decisions

## Requirements

### Decisions

### D1: How does the licence become detectable? [open]

GitHub reports the licence as Other. Its detector matches a file named LICENSE, LICENSE.md, LICENSE.txt or COPYING against known licence texts, so the filename alone is probably not the cause; the copyright line added above the AGPL body is the likelier one, since the detector matches on the text it expects to find first.

| Option                                      | Cost                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Move the copyright line below the AGPL text | Weakens the notice's placement, which validate-license wants at the top |
| Add a `license` field to the repo via API   | Not a thing GitHub offers; detection is from the file alone             |
| Leave it as Other                           | The repo page shows no licence, which a reviewer may read as unlicensed |

Not blocking. The directory requires the source be public under a licence, which it is, and the README and package.json both name AGPL-3.0-or-later. The repo page is cosmetic. Worth one experiment before the submission rather than a rewrite.

### Assumptions

- The two console.debug calls were the only ones that returned, and they are now gone. The grep covers src excluding tests and test-support. If a later commit adds more, the same grep is the check.
- No install is running an affected version, so removing the debug lines needed no migration. Nothing has shipped: there are no releases and no tags.
- The scan re-reads every release rather than only the first, which the earlier audit established. A regression landing after the listing is therefore caught at the next release, not silently accepted.

## Design

No design phase. Every item is a removal, a repo setting, or a hand-run step that docs/RELEASE.md already describes. Nothing here introduces a class, a seam or a signature to design against.
