---
created: 2026-09-18
updated: 2026-09-18
---

# Suggesting Tags: Spec

"Suggest some tags for this entry" cannot be answered today. The model cannot see which tags the vault already uses, so any tag it proposes is invented, and an invented tag splits the vault's vocabulary into near-duplicates no query reaches.

The work is one read-only tool. list_tags returns the vault's tags with the number of notes carrying each, sorted by count, narrowed by an optional filter. The model reads the target note, reads the tag list, and suggests from it. Writing the chosen tag uses the edit tools that already exist, per D1.

Obsidian indexes tags itself, in MetadataCache, covering frontmatter and inline tags alike. That is why the tool reads a cache rather than grepping: a regular expression over raw text matches #healthcare for #health and misses a frontmatter tags list entirely.

- [2-requirements.md](2-requirements.md) - why an invented tag is the defect, what the tool returns, and what stays out of scope
- [3-decisions.md](3-decisions.md) - why the edit tools apply the tag, what the list is sorted by, and the open question about finding notes by tag
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - six manual checks, since whether a suggested tag is a good tag is a judgement no unit test makes

One decision is open. D4 asks whether the tool also returns the notes carrying a tag; the lean is no, since the suggesting flow needs the vocabulary and not the notes.

The design phase is next: where the tag reader lives, whether it joins search or takes a package of its own, and what the result text says to the model.
