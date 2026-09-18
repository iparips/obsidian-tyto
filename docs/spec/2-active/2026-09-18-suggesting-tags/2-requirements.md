---
created: 2026-09-18
updated: 2026-09-18
---

# Requirements

"Suggest some tags for this entry" cannot be answered. The model has no way to see which tags the vault already uses, so any tag it proposes is invented. An invented tag is worse than none: it splits a vault's tag set into near-duplicates that no query reaches.

The work is one read-only tool, list_tags, returning the vault's existing tags. The model reads the note it is targeting, reads the tag list, and proposes tags from that list. Writing the chosen tag uses the edit tools that already exist.

## Motivation

### A Tag The Vault Does Not Use Is A New Tag

Tagging is only useful where the same tag reaches every note about a thing. A model guessing #journal against a vault that writes #daily-note has not tagged the entry, it has started a second vocabulary.

The model cannot tell the two apart from the note alone. The tag set lives across the vault, not in the note being edited, so nothing the turn already reads carries it.

### Grep Is The Wrong Tool For This

The model can already grep for a `#` pattern, but the result is note excerpts rather than a vocabulary. A grep returns the notes that mention a tag, capped and ranked, and says nothing about which tags exist or how often each is used.

Obsidian indexes tags itself. MetadataCache (Obsidian) holds a parsed tag list per note, covering both frontmatter tags and inline ones, so the vault's whole tag set is a cache walk rather than a content search. That is cheaper than a grep and it is also correct, where a regular expression over raw text is neither.

### What The Model Needs Is The Vocabulary And Its Weight

A tag used three hundred times is the vault's convention. One used once is a typo or an experiment. A flat alphabetical list hides that difference, so the model picks by string similarity and reproduces the typo.

Usage counts are what turn the list into a ranking the model can choose from.

## In Scope

- A list_tags tool, read-only, returning the tags the vault uses with the number of notes carrying each. Sorted by count, descending, so the vault's conventions lead.
- An optional filter argument, matching a substring of the tag name case-insensitively. A small vault calls it with nothing and reads the whole list; a large one narrows.
- A cap on what one call returns, in the shape MAX_GLOB_RESULTS (search) sets for globbing, with the total stated so a truncated list says it was truncated.
- Nested tags counted as they are written. Obsidian treats #project/tyto as its own tag and as a child of #project; the list reports the full string, since that is what an edit has to write.
- Applying a tag through the existing edit tools. The model writes the tag as text with insert_at, insert_text or replace_text, like any other content. No new write path, per D1.
- A prompt line saying to list before suggesting, and to suggest only from what came back. Its section sits with the search rules, which is where reaching beyond the note is already governed.
- Gating the tool behind the search setting, alongside the other read tools. Reading the vault's tag index is reaching outside the open note, which is the thing that setting governs.
- A prompt line inside the search section, which the release 3 fixture does not see. That fixture records a vault with search off, where the section is absent, so the guard stays green and is not re-recorded. Judging the wording still needs a real vault and key, per CLAUDE.md.

## Out of Scope

- A dedicated tag-writing tool. Frontmatter surgery through processFrontMatter (Obsidian) is safer than text editing, and it is also a second new tool and a second write path. Per D1, the edit tools carry it until they are shown not to.
- Deciding where in a note a tag goes. Frontmatter, a line under the title, or inline are all valid in different vaults, and a vault that cares says so in its AGENTS.md or a skill.
- Renaming or merging tags across the vault. That is a refactor over many notes, not a turn.
- Suggesting tags unprompted. The turn runs on what the user said, and a tag added to an entry the user asked nothing about is an edit they did not request.

## Scenarios

### The model suggests tags from the vault's own set

```gherkin
Given a vault whose notes carry #journal, #health and #work
When  the user says "suggest some tags for this entry"
Then  the model lists the vault's tags
And   it proposes tags from that list rather than inventing new ones
```

### A vault with no tags says so

```gherkin
Given a vault where no note carries a tag
When  the model calls list_tags
Then  the result says the vault uses no tags
And   the model says so rather than proposing a tag of its own
```

### A large tag set is narrowed by a filter

```gherkin
Given a vault using more tags than one call returns
When  the model calls list_tags with a filter
Then  only tags whose name contains the filter come back
And   the result states the total, so a truncated list reads as truncated
```

### Search off puts the tool out of reach

```gherkin
Given a vault with searching turned off in settings
When  a turn runs
Then  list_tags is absent from the offered tools
And   a call to it by name is refused with the reason
```

## References

Repo-relative links: this repo sets no sdd.link_base row, so they resolve in a checkout rather than in a hosted view.

### Task

- [3-decisions.md](3-decisions.md) - open first. Why the edit tools apply the tag, what the list is sorted by, and what the tool assumes about vault size.
- [src/engine/tools/tool-schemas.ts](../../../../src/engine/tools/tool-schemas.ts) - TOOL_SCHEMAS and ToolCatalogue (engine tools), where the schema and its gating go.
- [src/engine/tools/search-tools-service.ts](../../../../src/engine/tools/search-tools-service.ts) - the shape a read-only vault tool follows: a call in, a TextResult and a progress line out.
- [src/search/note-glob.ts](../../../../src/search/note-glob.ts) - MAX_GLOB_RESULTS and the capped-with-total result, the model for this tool's cap.
- [src/model/providers/models/tool-call.ts](../../../../src/model/providers/models/tool-call.ts) - the name constant and the predicates a new read tool joins.
- [src/model/prompt/system-prompt-sections/search-section.ts](../../../../src/model/prompt/system-prompt-sections/search-section.ts) - where the prompt rules for reaching beyond the note live.

### Architecture

- [docs/architecture/6-reaching-a-note.md](../../../architecture/6-reaching-a-note.md) - open first of these. Owns the read-only tools and what the search setting gates.
- [docs/architecture/5-asking-the-model.md](../../../architecture/5-asking-the-model.md) - open when changing the system prompt or the offered tool set.
- [docs/architecture/2-vocabulary.md](../../../architecture/2-vocabulary.md) - turn and turn step, before naming anything new.
