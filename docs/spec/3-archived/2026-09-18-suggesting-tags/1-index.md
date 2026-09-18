---
created: 2026-09-18
updated: 2026-09-18
---

# Suggesting Tags: Spec

"Suggest some tags for this entry" cannot be answered today. The model cannot see which tags the vault already uses, so any tag it proposes is invented, and an invented tag splits the vault's vocabulary into near-duplicates no query reaches.

The work is one read-only tool. list_tags returns the vault's tags with the number of notes carrying each, sorted by count, narrowed by an optional filter. The model reads the target note, reads the tag list, and suggests from it. Writing the chosen tag uses the edit tools that already exist, per D1.

Obsidian indexes tags itself, in MetadataCache, covering frontmatter and inline tags alike. That is why the tool reads a cache rather than grepping: a regular expression over raw text matches #healthcare for #health and misses a frontmatter tags list entirely.

- [0-prompt.md](0-prompt.md) - the block handing the build to a fresh session
- [2-requirements.md](2-requirements.md) - why an invented tag is the defect, what the tool returns, and what stays out of scope
- [3-decisions.md](3-decisions.md) - why the edit tools apply the tag, what the list is sorted by, and why the tool never answers which notes carry one
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - five manual checks, since whether a suggested tag is a good tag is a judgement no unit test makes
- [5-design-listing-the-vaults-tags.md](5-design-listing-the-vaults-tags.md) - where the tag reader lives, what the model reads back, and the three places the search gate holds
- [6-unit-tests.md](6-unit-tests.md) - the suite, and the test-support work that has to land before any of it runs
- [meta/1-index.md](meta/1-index.md) - what the design phase read, what each read changed, and what it cost

Every decision is settled. D4 resolved to list only: a tool returning paths would be a third source of the paths the model may shortlist and open, and no turn has needed it yet.

The build phase is next, handed over in 0-prompt.md. Nothing under src has moved, so the design is the whole of what exists.
