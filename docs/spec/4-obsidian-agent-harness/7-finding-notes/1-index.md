# Finding Notes: Spec

Replaces one fuzzy search with two exact tools: a glob over paths, and a grep
over content. The model lists what a folder holds before it guesses what a note
is called.

A delta on [1-harness-mvp](../1-harness-mvp/01-index.md), whose search flow this
retires. That design scored every note's contents and returned the best eight,
which answers "what did I write about roofing" and cannot answer "what notes are
in Week-35".

- [2-requirements.md](2-requirements.md) - the problem, the two tools, and what each must refuse
- [3-component-design.md](3-component-design.md) - the matcher, the two searchers, and what replaces VaultSearch
- [4-testing-strategy.md](4-testing-strategy.md) - unit test outline, branch by branch
- [5-implementation-order.md](5-implementation-order.md) - build order in two commits, and an exit test for each

Tags stay out. Obsidian's getAllTags merges frontmatter and inline tags into one
array, so a tag filter is cheap to add, but the test doubles have no
MetadataCache at all and that scaffolding is its own piece of work.

The reason to build this is a vault organised by path. A daily note lives at
`1 - Journal/Weekly/Week-35/04-09-Fri.md`, and every word that locates it is in
the path rather than the prose. Content search cannot see a folder name, so the
model guesses filenames and spends the turn on searches that match nothing.

Not started. Depends on nothing else in this release.
