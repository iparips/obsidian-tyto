---
created: 2026-09-18
updated: 2026-09-18
---

# Implementation Prompt: Worktree Build

Variant of [0-prompt.md](0-prompt.md) for a build in a worktree that ends in a
pull request. Not committed to main: the branch-and-PR shape is this run's,
not how the spec builds in general.

```text
Build the list_tags tool specified in
docs/spec/2-active/2026-09-18-suggesting-tags. You are in a git worktree at
obsidian-tyto-worktrees/suggesting-tags, already on branch suggesting-tags,
which is branched from main and is where every commit goes. Do not switch
branches and do not touch the main checkout: another session works there.

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

The suite was green at 1420 tests across 107 files in this worktree before you
started, and its dependencies are installed. Run bun run test, not bun run
verify: verify reformats the whole repo and writes main.js.

When the build is done and the suite is green, push the branch and raise a pull
request against main with gh pr create. The PR description follows the sdd
skill's pr-description-format; write it to 8-pr-description.md in the spec
folder, commit that, and pass it to gh with --body-file. Report the PR url when
it is open. Raise it once: if the branch is already pushed and a PR exists,
update it rather than opening a second.

4-acceptance-criteria.md holds what the suite cannot judge, including whether the
prompt wording makes the model list before suggesting. It needs a real vault and
a real API key. Do not run it yourself unless asked; say the work is ready for it.

If the spec is wrong, say so and fix it rather than building around it. Two of
its claims were already corrected during design, so a third is likelier than not.
```
