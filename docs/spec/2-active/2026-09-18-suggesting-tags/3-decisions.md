---
created: 2026-09-18
updated: 2026-09-18
---

# Decisions

## Requirements

### D1: Does a new tool write the tag, or do the edit tools? [resolved 2026-09-18]

The edit tools. Ilya: the tag tool is read-only, and applying a tag is text like any other.

A tag is text in a note. replace_text, insert_text and insert_at already write text against an anchor the model read, and the single-edit-per-step rule and the confirm flow already cover them. A tag tool that writes would need all of that again.

| Option                   | Cost                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| Edit tools apply the tag | Frontmatter is edited as text, so YAML shape is the model's to get right          |
| A dedicated add_tag tool | A second write path, its own confirm flow, and a second place the step rule holds |

The risk this carries: a model editing a frontmatter tags list as text can produce invalid YAML. The read-then-anchor shape limits it, since the model sees the exact block it is changing, and write_note exists for a note where the edit is scattered.

Revisit if a real vault shows broken frontmatter. processFrontMatter (Obsidian) is the fix, and it is a tool rather than a patch to this one.

### D2: What does the list return, and in what order? [resolved 2026-09-18]

Every tag with the count of notes carrying it, sorted by count descending, with an optional filter narrowing by substring. Ilya: both, list all with the filter optional.

A count is what separates the vault's convention from a typo used once, and a model given a flat list picks by string similarity instead. The filter is what keeps the tool usable on a vault with hundreds of tags, and it is optional because the model cannot guess a query before it has seen the vocabulary.

| Option                    | Cost                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| All tags, optional filter | One schema with an optional argument; a large vault needs two calls |
| Filter required           | The model queries before it knows the vocabulary, so it guesses     |
| All tags, no filter       | A large vault truncates and the model never sees the rest           |

### D3: Is the tool general, or shaped around journal entries? [resolved 2026-09-18]

General. Ilya: any note. Journal entries are the motivating case, not the scope.

Nothing about listing a vault's tags is specific to a daily note, and a tool that reads the target note's kind would need to know what a journal is, which is a vault convention rather than a harness one. A vault wanting journal-specific tagging says so in a skill.

### D4: Does the tool also find the notes carrying a tag, or only list tags? [open]

Only list, for now. The two questions a tag tool could answer are not equally served by grep, and only one of them justifies a tool.

Listing the vocabulary is the part grep cannot do. A grep for a tag pattern returns note excerpts, capped and ranked by note, so recovering the tag set means reading the excerpts and tallying by hand. The tool returns the set directly.

Finding notes by tag is the part grep can do, but wrongly. A regular expression for #health also matches #healthcare, matches the string inside a code fence, and misses a frontmatter `tags: [health]` entirely, since frontmatter writes tags without the hash. MetadataCache (Obsidian) has resolved all four cases already.

| Option                          | Cost                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| List only                       | Finding notes by tag stays a grep, with its false positives and its frontmatter blind spot |
| List, plus a paths flag         | One more argument and a second result shape on the same tool                               |
| A second find_notes_by_tag tool | Two tools where the model has to choose, and grep still exists beside both                 |

Leaning to list only. The suggesting flow needs the vocabulary and not the notes, so a paths flag would ship untested against the case it exists for. Add it when a real turn needs the notes and the grep gets them wrong.

### Assumptions

- A personal vault's tag set fits in one call. Obsidian's own tag pane is usable at these sizes, so a few hundred tags is the realistic upper bound. If a vault exceeds the cap routinely, the filter carries it and the prompt has to say to use it.
- MetadataCache (Obsidian) is populated when a turn runs. It indexes on load, and a turn happens after the plugin's own load. If a cold start ever races it, the tool reports fewer tags than the vault holds rather than failing, which reads to the model as a smaller vocabulary.
- The model will list before suggesting once told to. It follows the same shape for globbing before guessing a filename, which the search section already establishes. If it suggests tags without listing, the prompt line is not enough and the fix is a refusal on an edit writing a tag that no list returned, which is a larger rule.
- Counting notes per tag is the useful weight, not total occurrences. A note mentioning a tag five times is one note about that subject. If ranking looks wrong in practice, the count is the thing to change.

## Design

No design decisions yet. The design phase settles where the tag reader lives, whether it sits in search or in a package of its own, and what the result text looks like to the model.
