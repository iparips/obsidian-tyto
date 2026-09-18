---
created: 2026-09-18
updated: 2026-09-18
---

# Design Prompt: Searching For A Misheard Name

Paste the block below into a fresh session. The requirements, decisions and acceptance criteria are done; the design is not.

```text
Write the design for docs/spec/2-active/2026-09-18a-searching-for-a-misheard-name.
Design only: no production code, and nothing under src/ changes this session.

Read 1-index.md, then 2-requirements.md, 3-decisions.md, 4-acceptance-criteria.md.
All four decisions are resolved — implement them rather than reopening them.

The change: a voice harness gets the transcriber's guess at a name, not the name.
Seven changes let the model work with that — two to the search code the prompt
rules depend on, four to the prompt, one to the turn loop.

Load the sdd skill and follow references/design-conventions.md, plus the
code-generation, code-unit-tests, mermaid and text-generation skills. This repo
has no feature flags and no logging layer: drop the Feature flag, Gating and
Logging sections and the flag precedent search, and draw one sequence diagram
with no alt branch on a flag. Read docs/architecture/1-overview.md before adding
a file, 2-vocabulary.md before calling anything a turn or a turn step, and
5-asking-the-model.md before moving prompt text.

Verify before trusting, all read 2026-09-18: note-grep.ts:92 is
matches[0].index; NoteExcerpt is a fixed 200 characters; MAX_HITS is 10 and
MAX_PATHS 50; TurnEndingKind has five values; mistral-provider.ts parseResponse
renders any non-ok response as "API responded <status>:" plus a 200-char
snippet; the release 3 fixture is 33 lines and contains no occurrence of
"search", "glob", "grep" or "choose_note".

The hardest call is the shape of a grep result now that a note carries many
matches. SearchHit holds one excerpt and a match count, and SearchReport renders
a row per hit. Say what a hit becomes, how merged windows are represented, how
SearchReport renders them, and whether MAX_HITS still means what it meant when a
hit cost one 200-character excerpt. Decide it on answer quality, which is what
D4 turns on, and state the payload arithmetic you accept.

Second: what the harness knows at overflow. The continuation prompt is written
by the harness, not the model, because an overflow is the model call failing.
Say which collaborator builds it and which of the utterance,
PathsReturnedByVaultRepository, NotesReadRepository and the progress lines it
reads — the first is session-scoped and the third turn-scoped.

Secondary: the prompt changes are text edits to two files. Their real cost is the
fixture re-record, which per D3 is the review surface — a re-recorded fixture
mentioning a search tool means a gated rule leaked into the ungated path.

Plan unit tests against src/search/tests/note-grep.test.ts and
search-report.test.ts, src/model/prompt/tests/system-prompt.test.ts, and
src/engine/tests/conversation-turn-runner-endings.test.ts and
harness-tools-grep.test.ts. Use the helpers in src/test-support.

Check your work with `bun run test`, not `bun run verify`: verify runs prettier
over the repo and writes main.js, leaving a diff to unpick from the design.

A sibling spec, docs/spec/2-active/2026-09-18-suggesting-tags, is being built in
this same checkout and its design touches three files yours does:
src/search/search-report.ts, src/search/note-glob.ts and
src/engine/tools/tool-schemas.ts. Designing over that is fine, since neither
phase writes code, but read its 5-design file before proposing a shape for a
search result — it adds a tag tool and a tag report beside the grep report, and
two designs inventing different shapes for the same rendering would collide at
build time. Say in your Out of scope section which of the three files both
touch, so whoever builds second knows to rebase rather than assume.

Where the spec is wrong, say so and fix it rather than designing around it.
Three of its claims were corrected during requirements after the code
disagreed, so it has been wrong before.
```
