---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Prompt

Hands the build to a fresh session. Paste the block whole.

```text
Build the change specified in
docs/spec/2-active/2026-09-18a-searching-for-a-misheard-name: a grep that
returns every match, two new turn endings, and four prompt rules.

Read 1-index.md, then design-searching-for-a-misheard-name/1-index.md, whose
7-scope-and-rollout.md owns the build order: six commits, each landable alone.
Read 2-what-a-search-returns.md and 5-new-interfaces-search.md before commits 1
to 3, and 3-endings-and-the-prompt.md with 6-new-interfaces-engine.md before 4
to 6. Read 6-unit-tests.md before writing a method's tests. All nine decisions
in 3-decisions.md are resolved, so nothing there is waiting on you.

Conventions are in CLAUDE.md and docs/architecture: 4-the-turn.md for where an
ending fits, 5-asking-the-model.md for prompt text.

Verify these before trusting them. They were read on 2026-09-18 after pull
request 8 merged, and the code may have moved again. NoteExcerpt.around has one
caller and SearchHit.describe one production caller, which is what makes
replacing each safe rather than a change to an unchanged path. TurnSpend is
constructed once, in ConversationTurnRunner.run, so a counter added to it needs
no wiring change.

Commit 5 rests on a claim nothing in this repo has tested: that Mistral makes a
context overflow distinguishable from a bad key or a rate limit. parseResponse
reads only the status and a snippet, so there is no prior art to copy. Send an
oversized payload to the real API and read the actual error body before writing
ContextOverflow.isOverflow, rather than guessing a match string.

The suite was green at 1469 tests across 111 files before this work started. Run
bun run test, not bun run verify: verify reformats the whole repo and writes
main.js.

4-acceptance-criteria.md needs a real vault and a real API key. Do not run it
yourself unless asked; say the work is ready for it.

If the spec is wrong, say so and fix it rather than building around it. Three of
its claims were corrected during requirements and two more during design, so a
sixth is likelier than not.
```
