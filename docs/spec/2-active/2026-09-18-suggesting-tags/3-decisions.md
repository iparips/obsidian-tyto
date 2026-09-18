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

### D4: Does the tool also find the notes carrying a tag, or only list tags? [resolved 2026-09-18]

List only. Settled in the design: a paths flag would make a read-only vocabulary tool a third source of the paths the model may shortlist and open, and every such source is designed in 6-reaching-a-note.md.

Listing the vocabulary is the part grep cannot do. A grep for a tag pattern returns note excerpts, capped and ranked by note, so recovering the tag set means reading the excerpts and tallying by hand. The tool returns the set directly.

Finding notes by tag is the part grep can do, but wrongly. A regular expression for #health also matches #healthcare, matches the string inside a code fence, and misses a frontmatter `tags: [health]` entirely, since frontmatter writes tags without the hash. MetadataCache (Obsidian) has resolved all four cases already.

| Option                          | Cost                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| List only                       | Finding notes by tag stays a grep, with its false positives and its frontmatter blind spot |
| List, plus a paths flag         | One more argument and a second result shape on the same tool                               |
| A second find_notes_by_tag tool | Two tools where the model has to choose, and grep still exists beside both                 |

Both grep failures are recoverable by the model rather than silent: a grep for the tag word finds the frontmatter notes even without the hash, and the excerpt shows which tag the note actually carries. Reopen this when a real turn needs those notes and the grep gets them wrong.

### Assumptions

- A personal vault's tag set fits in one call. Obsidian's own tag pane is usable at these sizes, so a few hundred tags is the realistic upper bound. If a vault exceeds the cap routinely, the filter carries it and the prompt has to say to use it.
- MetadataCache (Obsidian) is populated when a turn runs. It indexes on load, and a turn happens after the plugin's own load. If a cold start ever races it, the tool reports fewer tags than the vault holds rather than failing, which reads to the model as a smaller vocabulary.
- The model will list before suggesting once told to. It follows the same shape for globbing before guessing a filename, which the search section already establishes. If it suggests tags without listing, the prompt line is not enough and the fix is a refusal on an edit writing a tag that no list returned, which is a larger rule.
- Counting notes per tag is the useful weight, not total occurrences. A note mentioning a tag five times is one note about that subject. Re-examined and kept in D7; if ranking looks wrong in practice, the count is the thing to change.

## Design

### D5: Does the tag reader live in search, or in a package of its own? [resolved 2026-09-18]

In src/search, as TagReader (Search, new) beside NoteGlob and NoteReader.

A package of its own would depend on obsidian and shared, be constructed in EngineFactory (Wiring), and be reached only through the engine's tool service. That is the arrow set search already has, so the second package would be indistinguishable from the first.

| Option                   | Cost                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| In src/search            | The package name reads as content search, where this walks an index                     |
| A tags package of its own | A second package with the same dependencies and one entry point, for four files          |

The ten-file folder limit does not force the split: src/search holds five files today.

### D6: Does the tag list reuse SearchReport, or take a reporter of its own? [resolved 2026-09-18]

Its own, TagReport (Search, new).

A tag row is a count and a name where a glob row is a path, and the empty case is a statement about the vault rather than about a pattern. The only shared shape is the trimmed line, which is three lines of formatting.

| Option                       | Cost                                                                    |
| ---------------------------- | ------------------------------------------------------------------------ |
| A TagReport of its own       | The trimmed-line shape is written twice and can drift                   |
| A third method on SearchReport | One class holding three unrelated result shapes and their empty cases   |

### D7: Does a tag count notes or occurrences? [resolved 2026-09-18]

Notes, as D2 said, and the design keeps it.

The prompt handing over this design flagged it as the choice most likely to be wrong in practice, so it was re-examined rather than inherited. It holds: the model is choosing a tag for one note, so the question is how many notes are about a subject, not how many times a note repeats a hash. Counting occurrences would rank a note that hashtags a word in every paragraph above a subject fifty notes share.

| Option                | Cost                                                                          |
| --------------------- | ------------------------------------------------------------------------------- |
| Notes per tag         | A tag's weight says nothing about how central it is within any one note        |
| Total occurrences     | One note repeating a tag outranks a tag many notes carry, which is the ranking |

Revisit only if a real vault shows the ranking wrong, per D2's own assumption.

### Assumptions

- getAllTags (Obsidian) returns every tag hashed, from both the frontmatter list and the note body. The typings describe it as combining all tags from frontmatter and content into a single array. If frontmatter entries come back unhashed, the tally splits health and #health into two rows and TagReader has to normalise before counting.
- getAllTags may repeat a tag a note carries twice, so the walk puts each note's tags through a Set. If it already de-duplicates, the Set costs nothing and the count is unchanged either way.
- A tags cap of 50 is enough for a personal vault, mirroring MAX_GLOB_RESULTS. If a vault routinely truncates, the filter carries it and the prompt line has to say to use it, per the requirements' own assumption about vault size.
- The obsidian mock and FakeVault (Test Support) can carry a MetadataCache fake without a real Obsidian. Both are hand-written stand-ins already and nothing in the tag walk needs Obsidian's parser. If the parsing itself turns out to need testing, that is a case for the real vault rather than a fake.

