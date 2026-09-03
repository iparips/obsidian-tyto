# Requirements: Finding Notes

Give the model two exact ways to reach a note: a glob over paths and a grep over
content. Retire the fuzzy search that could do neither well.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [Two tools, one job each](#two-tools-one-job-each)
6. [Why fuzzy search goes](#why-fuzzy-search-goes)
7. [Ordering the results](#ordering-the-results)
8. [Requirements](#requirements)
9. [Non-functional requirements](#non-functional-requirements)
10. [What the design must settle](#what-the-design-must-settle)

## Problem

A vault is organised by path. A daily note lives at
`1 - Journal/Weekly/Week-35/04-09-Fri.md`, and everything that locates it is in
that path: the year, the week, the day.

The harness MVP gave the model one way to find a note: score every note's
contents against a query and return the best eight
([07-search-and-answering.md](../4-harness-mvp/07-search-and-answering.md)). A
folder name appears in no note's prose, so that search cannot see it.

Asked for last Friday's note, the model reasons its way to `Week-35`, searches
for it, and gets nothing. It has no way to list what the folder holds, so it
guesses a filename, searches for that, and gets nothing again. Four searches
later the turn is out of steps.

Every one of those searches was correct, and every one returned nothing. The
tool could not answer the question being asked of it.

Path scoring narrows the gap: a query matching a path now scores. It does not
close it, because the model still has to guess the name before it can search for
it. Guessing is the step to remove.

## Goals

- List the notes under a path, so the model reads names rather than inventing
  them.
- Match paths by pattern, so a naming convention can be asked about directly.
- Find exact text in notes, with the paths that hold it.
- Return paths alone when the paths are the answer, so reconnaissance is cheap.
- Order results by what the instruction cares about, rather than by one fixed
  rule.
- Keep a vault of any size to one pass and a bounded payload.
- Keep answering a question about the vault working, on whatever these return.

## Non-goals

- Fuzzy or relevance-scored matching. Exactness is the point.
- Tags. Cheap to add later, but the test doubles have no MetadataCache.
- Searching anything but markdown notes.
- Writing what a search found into a note. Still release 7.
- Regular expressions the user writes. The model writes them.
- Replacing the allowed-command route to a note. A command still wins.

## User stories

- As a user, I ask for last Friday's note and the model lists the week folder
  rather than guessing what the file is called.
- As a user with a dated vault, the model finds a note by its folder and
  filename, which is where the date lives.
- As a user, I ask what I wrote about roofing and the model finds the exact word
  and tells me which notes hold it.
- As a user, I ask for my most recent note in a folder and get the newest, not
  the alphabetically last.
- As a user, a search that matches nothing says so, rather than the model
  answering from its own knowledge.
- As a user, a turn that spends its search budget stops searching rather than
  retrying the call it just lost.
- As a user with search turned off, neither tool is offered and the model says
  it cannot reach the destination.

## Two tools, one job each

| Tool       | Matches            | Returns                    | Answers                        |
| ---------- | ------------------ | -------------------------- | ------------------------------ |
| glob_notes | A path pattern     | Paths                      | What notes are in Week-35?     |
| grep_notes | Exact text or regex| Paths, with excerpts       | Which notes mention roofing?   |

The split is between locating a note and looking inside one. A model that knows
where a note lives should not have to read prose to confirm it, and a model
looking for a phrase should not have to know which folder holds it.

Glob is the reconnaissance tool. It is cheap, it returns only paths, and its
result shows a folder's naming convention at a glance. That is what removes the
guessing: seeing `04-09-Fri.md` beside `03-09-Thu.md` says what the convention is
without a single content read.

## Why fuzzy search goes

Fuzzy search and exact search overlap enough that offering both makes the model
choose, and it chooses before it knows which will work. In the failing turn above
it chose fuzzy four times, correctly by its own lights, and got nothing each
time.

Exactness also makes a miss informative. A fuzzy search returning nothing might
mean the note does not exist, or that the query was worded badly, or that the
scorer ranked it below the cap. An exact search returning nothing means the text
is not there.

What is lost is the vague question: "what did I write about the roof" no longer
matches a note that says "roofing". The model must pick the literal term, or
glob the likely folder and read. That is a real cost, accepted because the
failure it removes is worse: a tool that silently cannot answer.

Answering a question about the vault survives unchanged. answer_from_search takes
text and paths the model supplies, and never read the scores.

## Ordering the results

Both tools take a sort field and a direction, because the right order depends on
the instruction rather than on the tool.

| Sort       | Offered by | Orders by                        | Default direction |
| ---------- | ---------- | -------------------------------- | ----------------- |
| path       | Both       | The path, alphabetically         | Ascending         |
| modified   | Both       | The note's modification time     | Descending        |
| matches    | grep only  | How many times the pattern hit   | Descending        |

Path is the default, because a listing read in path order shows a naming
convention and a listing read in date order does not.

The direction defaults per field rather than globally. Ascending is right for a
path and wrong for a date: `sort: modified` almost always means the newest
first, and a fixed ascending default would make the common case need an extra
argument to express.

matches is grep's alone. A path either matches a glob or does not, so there is
no count to order by.

## Requirements

### Listing notes by path

FR1. Give the model a tool that returns the paths of notes matching a path
pattern.

FR2. Support `*` within one path segment, `**` across segments, and `?` for one
character.

FR3. Return paths only. A listing is about where notes are, and reading them is
a separate call.

FR4. Return an empty result rather than an error when a pattern matches nothing,
so the model reads it as an answer.

### Finding notes by content

FR5. Give the model a tool that returns the notes whose contents match a regular
expression.

FR6. Let that tool take a path pattern as well, so a search can be narrowed to a
folder before it reads anything.

FR7. Return an excerpt around each match, so the model can tell a real hit from
an incidental one.

FR8. Let the model ask for paths alone, so a search whose answer is a location
costs no excerpt payload.

FR9. Refuse an invalid regular expression by saying so, rather than failing the
turn.

### Ordering

FR10. Let both tools take a sort field of path or modified, defaulting to path.

FR11. Let grep also sort by how many times the pattern matched.

FR12. Let both tools take a direction, defaulting to ascending for path and
descending for modified and matches.

### Bounding the cost

FR13. Cap the number of results each tool returns, and say how many were found
when the cap trimmed them.

FR14. Cap each tool's calls per turn, counted separately from each other and
from the existing search budget.

FR15. Drop a tool from the offered set once its per-turn cap is spent, so a
refused call cannot be retried.

### Retiring the old search

FR16. Remove search_vault from the offered tools and from the prompt.

FR17. Keep read_note and answer_from_search working, drawing on what the two new
tools return.

FR18. Offer neither new tool when search is turned off in settings.

### What the panel shows

FR19. Report each glob and grep as a step, naming the pattern and how many notes
matched.

## Non-functional requirements

NFR1. One pass over the vault per call, and a payload bounded by the result cap
and the excerpt width, whatever the vault's size.

NFR2. A glob reads no note contents. Matching a path must not cost a read.

NFR3. Neither tool changes the note the session edits, nor binds an unbound
session.

NFR4. A vault with search disabled behaves exactly as it does today, including
the prompt it sends byte for byte.

NFR5. A pattern the user's own vault cannot contain is not an error. Nothing
matching is an answer.

NFR6. The prompt states the order to try: a command, then a glob, then a grep,
then reading. A model given four ways to find a note will otherwise reach for
the most general.

## What the design must settle

- What grep does with a pattern matching a note thousands of times, given the
  excerpt is per match rather than per note. The count is wanted for sorting;
  every offset is not.
- Whether the excerpt for grep reuses NoteExcerpt's fixed width or takes lines
  either side of the match, which reads better for prose.
- How the two caps interact with the iteration cap, since a turn that globs
  three times and greps four has spent seven of ten steps.
- Whether the read budget of four should fall now that read_note no longer
  shares it with a search, and whether its cap message should stop saying
  "searched or read".
