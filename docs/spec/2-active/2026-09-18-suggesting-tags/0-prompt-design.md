---
created: 2026-09-18
updated: 2026-09-18
---

# Design Prompt

Hands the design phase of this spec to a fresh session. Writing the design only, not building it. Paste the block below, or run new-agent-tab on this file.

```text
Write the design doc for the spec in
docs/spec/2-active/2026-09-18-suggesting-tags. Design only: write no production
code and change nothing under src. Work on main, in this checkout.

Read 1-index.md, then 2-requirements.md, then 3-decisions.md, then
4-acceptance-criteria.md. D1, D2 and D3 are resolved and the design implements
them rather than reopening them. D4, whether the tool also returns the notes
carrying a tag, is open and yours to settle in the design; the requirements lean
to list only, and the lean is not a decision.

The change is one read-only tool. list_tags returns the vault's tags with the
number of notes carrying each, sorted by count descending, narrowed by an
optional substring filter. It reads Obsidian's MetadataCache rather than
grepping, which is what gets frontmatter tags, inline tags and correct tag
boundaries in one walk. Applying a tag is the existing edit tools' job, per D1,
so nothing new writes.

Load the sdd skill and follow references/design-conventions.md. This repo has no
feature flags and no flag registry, so the Feature flag and Gating sections have
no content: say so once and drop them rather than inventing a flag. The repo's
conventions are in CLAUDE.md and docs/architecture; read 6-reaching-a-note.md
before adding a tool that reaches the vault, 1-overview.md before placing a new
file, and 2-vocabulary.md before naming anything.

Verify these before trusting them. Each was read on 2026-09-18 and the code may
have moved. TOOL_SCHEMAS in src/engine/tools/tool-schemas.ts holds the schema
list, and ToolCatalogue.isOffered below it decides what a capability gates;
SEARCH_TOOLS at the bottom of that file is the list a read-only vault tool
joins. SearchToolsService.glob shows the shape: a ToolCall in, a TextResult
carrying report text and a ProgressLine out. NoteGlob caps at MAX_GLOB_RESULTS
of 50 and returns a GlobResult holding paths plus an uncapped total, with
wasTrimmed() on it; SearchReport.ofGlob turns that into the model's text.
EngineFactory constructs NoteGlob and SearchToolsService around line 150, which
is the only place allowed to construct across packages.

D4 is the decision with teeth. Listing the vocabulary is what grep cannot do;
finding notes by tag is what grep does badly, matching #healthcare for #health
and missing a frontmatter tags list entirely. Say in the design whether the tool
answers the second question too, and if not, what a model needing those notes
does instead.

Two placement questions the design has to settle. Whether the tag reader lives
in src/search beside NoteGlob and NoteReader, or in a package of its own, given
that it reads an index rather than searching content. And what the result text
says to the model: SearchReport is the precedent, and a tag list with counts and
a possible truncation is not the same shape as a path list.

Plan the unit tests against src/search/tests, where note-glob.test.ts and
search-report.test.ts are the models to follow, and src/engine/tools/tests,
which holds tool-catalogue.test.ts and is where the gating case belongs. Use the
helpers in src/test-support rather than writing new fakes. The tool is gated
behind the search setting, so the catalogue test has a case for search off.

Editing the system prompt re-records
src/model/prompt/tests/fixtures/release-3-prompt.txt, which CLAUDE.md calls the
guard on prompt drift: re-record it deliberately rather than working around it,
and note in the design that the wording needs a real vault and key to judge.

Do not run the build to check your work: it reformats the repo and writes
main.js. bun run test is enough.

If the spec is wrong, say so and fix it rather than designing around it. Three
decisions were settled in conversation from a voice note, and the counting
choice in D2, notes per tag rather than total occurrences, is the one most
likely to be wrong in practice.
```
