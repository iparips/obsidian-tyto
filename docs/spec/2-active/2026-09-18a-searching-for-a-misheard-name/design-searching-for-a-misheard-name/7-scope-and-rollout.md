---
created: 2026-09-18
updated: 2026-09-18
---

# Design: Out Of Scope, Tests And Rollout

What this change deliberately leaves, the files the sibling spec also writes, and the order the commits land. Part of [1-index.md](1-index.md).

## Out of scope

- A turn-wide token budget, per D4. Returning every match makes an overflow likelier, and the ending plus the continuation prompt is the cheaper half. D4 records the fill order to pick up if a real vault overflows often.
- Enumerating PathsReturnedByVaultRepository (Engine Turn). Widening a session-scoped repository to serve one turn's ending is the wrong shape, and the notes read answer the question better.
- Re-wording the existing Globbing rule that ends a glob in choose_note. It is correct for the edit path it was drafted for, and the new question route covers the other case.
- Making an overflow recoverable inside the turn, by retrying with less context. That is the budget by another name.

### Files the sibling spec also writes

2026-09-18-suggesting-tags is being built in this checkout. Whoever builds second rebases rather than assuming.

- src/engine/tools/tool-schemas.ts. Both add to TOOL_SCHEMAS: that spec a whole list_tags schema and a SEARCH_TOOLS entry, this one one property on grep_notes.
- src/engine/tools/search-tools-service.ts. That spec adds a listTags method; this one changes what grep passes back.
- src/model/prompt/system-prompt-sections/search-section.ts. That spec appends a Tagging block; this one changes the trailing unheaded group. Both re-record nothing in the fixture from this file, since it is gated.

The design prompt names search-report.ts and note-glob.ts as shared. They are not: the sibling reads both as precedent and writes neither, adding TagReport (Search, new) as its own file.

## Unit tests

The plan is [6-unit-tests.md](../6-unit-tests.md), beside the design rather than inside it.

One gap to know before starting: search-report.test.ts covers ofGlob only and has no ofGrep case at all, so the grep rendering tests are new rather than edits. The FakeVault (Test Support) helpers need nothing added; multi-line notes go through withNote as they are.

## Rollout

1. Land NoteExcerpt and NoteExcerpts (Search, new) with their merging tests, leaving NoteGrep on the old path.
2. Land the SearchHit change, the context_lines argument on GrepRequest, the MAX_HITS drop and the new NoteGrep.excerpt, deleting the old note-excerpt.ts.
3. Land the SearchReport block rendering and the grep_notes schema property.
4. Land EmptySearchCounter, the foundNothing field on TextResult and ToolCallOutcome, the TurnSpend entry and the runner branch, with the FoundNothing ending.
5. Land ContextOverflow (Model Providers, new), the parseResponse branch, ContinuationPrompt and the Overflowed ending.
6. Land the four prompt rules, re-record the fixture as a deliberate two-line diff, run bun run test, then judge the wording against a real vault and a real key.

## References

- [2-requirements.md](../2-requirements.md) - the seven changes and the two things that turned out not to be broken
- [3-decisions.md](../3-decisions.md) - D1 to D4, all resolved before this design
- [4-acceptance-criteria.md](../4-acceptance-criteria.md) - the six checks a person runs against a real vault
- [docs/architecture/4-the-turn.md](../../../../architecture/4-the-turn.md) - how a turn ends, and what lives under engine/turn
- [docs/architecture/5-asking-the-model.md](../../../../architecture/5-asking-the-model.md) - what one model call is made of, read before moving prompt text
- [src/search/note-grep.ts:86](../../../../../src/search/note-grep.ts) - excerpt, taking matches[0].index at line 92, with MAX_HITS at line 11
- [src/search/note-excerpt.ts:1](../../../../../src/search/note-excerpt.ts) - the fixed 200-character window this replaces
- [src/search/models/search-hit.ts:4](../../../../../src/search/models/search-hit.ts) - the hit, with describe at line 13
- [src/search/search-report.ts:32](../../../../../src/search/search-report.ts) - ofGrep, with rows at line 41 and trimmedLine at line 48
- [src/engine/tools/search-tools-service.ts:40](../../../../../src/engine/tools/search-tools-service.ts) - reported, which holds the GrepResult the counter's fact comes from
- [src/engine/turn/spending/repeated-refusal-counter.ts:8](../../../../../src/engine/turn/spending/repeated-refusal-counter.ts) - the counter EmptySearchCounter is shaped after
- [src/engine/turn/conversation-turn-runner.ts:65](../../../../../src/engine/turn/conversation-turn-runner.ts) - the isStuck branch the found-nothing one sits beside
- [src/engine/turn-ending-service.ts:35](../../../../../src/engine/turn-ending-service.ts) - endTurnAsCancelled, the shape the overflow ending follows
- [src/engine/turn/paths-returned-by-vault-repository.ts:6](../../../../../src/engine/turn/paths-returned-by-vault-repository.ts) - session-scoped, and exposing includes alone
- [src/engine/turn-progress-publisher.ts:7](../../../../../src/engine/turn-progress-publisher.ts) - one-way by design, which is why the progress lines cannot be read back
- [src/model/providers/mistral-provider.ts:87](../../../../../src/model/providers/mistral-provider.ts) - parseResponse, rendering any non-ok response as a status and a snippet
- [src/model/prompt/system-prompt-sections/search-section.ts:58](../../../../../src/model/prompt/system-prompt-sections/search-section.ts) - the trailing unheaded group three rules join
- [src/model/prompt/system-prompt-sections/dictation-section.ts:11](../../../../../src/model/prompt/system-prompt-sections/dictation-section.ts) - the duplicated checkbox line, repeated at line 12
- [src/model/prompt/tests/system-prompt.test.ts:510](../../../../../src/model/prompt/tests/system-prompt.test.ts) - the fixture assertion, with the re-record log at line 13
- [docs/spec/2-active/2026-09-18-suggesting-tags/5-design-listing-the-vaults-tags.md](../../2026-09-18-suggesting-tags/5-design-listing-the-vaults-tags.md) - the sibling spec, for the files both write
