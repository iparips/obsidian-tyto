---
created: 2026-09-18
updated: 2026-09-18
---

# Decisions

## Requirements

### Decisions

### D1: How does the licence become detectable? [resolved 2026-09-18]

Both causes fixed in fea533f. The guess below named one of the two.

The copyright notice sat above the licence body, so the file did not open on
the text a detector matches. It now fills the AGPL's own instantiation
template near the end, which is where the licence says to put it, and nothing
about the notice is weakened by sitting there.

The second cause was not guessed at: prettier had reflowed the whole document,
stripping its indentation and collapsing the double spaces after full stops.
That is a change to a text whose own terms forbid changing it, and it survives
the whitespace normalisation a detector does. The body is now byte for byte the
canonical AGPL, and .prettierignore keeps prettier off it.

| Option                                      | Cost                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Move the copyright line below the AGPL text | Weakens the notice's placement, which validate-license wants at the top |
| Add a `license` field to the repo via API   | Not a thing GitHub offers; detection is from the file alone             |
| Leave it as Other                           | The repo page shows no licence, which a reviewer may read as unlicensed |

Confirm on the repo page once the branch is pushed: GitHub re-runs detection on
a push to the default branch. Still Other after that means the remaining cause
is something neither reading found, and it does not block the submission.

### Assumptions

- The two console.debug calls were the only ones that returned, and they are now gone. The grep covers src excluding tests and test-support. If a later commit adds more, the same grep is the check.
- No install is running an affected version, so removing the debug lines needed no migration. Nothing has shipped: there are no releases and no tags.
- The scan re-reads every release rather than only the first, which the earlier audit established. A regression landing after the listing is therefore caught at the next release, not silently accepted.

## Design

No design phase. Every item is a removal, a repo setting, or a hand-run step that docs/RELEASE.md already describes. Nothing here introduces a class, a seam or a signature to design against.
