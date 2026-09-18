---
created: 2026-09-18
updated: 2026-09-18
---

# Suggesting tags: list the vault's vocabulary before proposing one

Spec: [docs/spec/2-active/2026-09-18-suggesting-tags](1-index.md)

## Motivation

"Suggest some tags for this entry" cannot be answered today. The model cannot see which tags the vault already uses, so any tag it proposes is invented, and an invented tag splits the vocabulary into near-duplicates no query reaches.

## Outline

- list_tags returns the vault's tags with the number of notes carrying each, sorted by count descending, narrowed by an optional case-insensitive substring filter. Fifty rows at most, with the uncapped total beside them.
- TagReader (Search, new) reads MetadataCache (Obsidian) rather than note text, so a frontmatter tags list and an inline hash are one vocabulary and #health never matches #healthcare. A tag repeated within a note counts that note once, and a nested tag is its own row rather than rolled into its parent.
- The search setting gates it in three places: the schema drops out of the catalogue, HarnessToolsService (Engine Tools) refuses the call, and ToolCall.isListTags (Model Providers Models, new) routes it with the other vault readers.
- It records no path, so nothing it returned becomes a note the model may open. That keeps a read-only vocabulary tool out of the write path, per D4.
- It carries no applicable_skills argument: it takes no path and covers the whole vault, so a skill has nothing to say about it.
- The panel gains a Listed tags line naming the filter, or the whole vault where none was sent, and the tag count.
- The prompt's search section gains two tagging rules: list before suggesting, and say the vault has no tag for it rather than inventing one.

## Test plan

- 49 tests across the tag reader, the report, the tool service, the dispatch path, the catalogue gate and the prompt. Full suite green at 1469 across 111 files.
- The release 3 prompt fixture is unchanged and stays green: the tagging rules sit inside SearchSection (Model Prompt), which returns nothing when search is off.
- Whether the wording makes the model list before suggesting is a judgement no unit test makes. The five manual checks in [4-acceptance-criteria.md](4-acceptance-criteria.md) need a real vault and a real API key, and have not been run.
