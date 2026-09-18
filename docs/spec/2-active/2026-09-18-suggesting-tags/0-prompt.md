---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Prompt

Hands the build to a fresh session. Paste the block whole.

```text
Build the list_tags tool specified in
docs/spec/2-active/2026-09-18-suggesting-tags. Work on main, in this checkout.

Read 1-index.md, then 5-design-listing-the-vaults-tags.md, whose Rollout section
owns the build order: five commits, and the first lands test support with no
production code. Read its New interfaces section before creating any file, and
6-unit-tests.md before writing tests. 3-decisions.md holds why, and every
decision in it is resolved, so nothing there is waiting on you.

The repo's conventions are in CLAUDE.md and docs/architecture, and
6-reaching-a-note.md governs the tool dispatch path.

Verify these before trusting them. They were read on 2026-09-18 and the code may
have moved. getAllTags is a module-level export of obsidian, not a method on
MetadataCache, and App.metadataCache is what EngineFactory passes. TOOL_SCHEMAS
drives ToolDispatcher.definedToolNames, so adding the schema is what makes an
unknown-name refusal stop firing: check that still holds rather than adding the
name in a second place. HarnessToolsService.execute ends by falling through to
NotePathsShortlistTool.offerPaths, so a branch left out is dispatched as a
shortlist rather than failing.

The suite was green at 1420 tests across 107 files before this work started. Run
bun run test, not bun run verify: verify reformats the whole repo and writes
main.js.

4-acceptance-criteria.md holds what the suite cannot judge, including whether the
prompt wording makes the model list before suggesting. It needs a real vault and
a real API key. Do not run it yourself unless asked; say the work is ready for it.

If the spec is wrong, say so and fix it rather than building around it. Two of
its claims were already corrected during design, so a third is likelier than not.
```
