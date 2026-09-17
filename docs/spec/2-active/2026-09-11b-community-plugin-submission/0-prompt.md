---
created: 2026-09-17
updated: 2026-09-17
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Bring Tyto in line with the Obsidian community directory's rules, so it can be
submitted. The spec is docs/spec/2-active/2026-09-11b-community-plugin-submission.

Read first, in this order:
- 1-index.md, for the shape of the work and what the audit already cleared.
- 4-design/6-the-automated-review.md, because the scanner is the reviewer and
  two other design files changed to suit what it runs.
- 3-requirements.md, for scope and the three settled decisions.
- 5-tasks.md, which is the build order. Commits 1 and 2 have shipped; start at
  commit 3.

Read the matching design file immediately before the commit that needs it, not
up front. 4-design/1-index.md maps commit to file.

Repo conventions are in AGENTS.md: package layout, the wiring rule, where
repositories may live, and the rule that a prompt change is a behaviour change.
Prose and markdown rules are the text-generation skill's.

Verify before trusting, because the spec was written across several sessions:
- The eight console.debug calls. Grep for them rather than using the per-file
  counts, which are the thing most likely to have moved.
- That SkillRepository and AgentsMdRepository are still constructed in
  PluginScope with this.app.vault.adapter, since commit 7 changes that seam.
- That `bun run lint` still reports no errors. Commit 2 left four warnings, all
  owned by commit 6; anything else is new and worth reading before you build on
  it.

Already verified, so take these as given: the installed obsidian typings are
1.13.1 and carry getSettingDefinitions with every control type the design names;
no control masks a value, which is why the API key uses a render callback; and
the three lint rules that callback could trip do not fire on it.

End-to-end check the suite cannot make: install the built plugin into a real
vault with a real Mistral key, run one spoken turn, and confirm the edit lands
with a silent console. Then open the settings tab beside a core plugin's and
confirm it looks native and appears in 1.13's settings search.

If the spec is wrong, say so and fix the spec, rather than building around it.
Commit 2 recorded two findings the audit missed, in 5-tasks.md. Anything the
linter raises that is still unrecorded belongs in 2-audit/ before the code
changes.

You are in a worktree at obsidian-tyto-worktrees/submission, on the branch
community-plugin-submission. The deferred-views spec is being built in parallel
in a sibling worktree, so stay on your own branch and do not touch main.

This overrides the repo's usual rule of committing to main. Commit to the
branch as you go, one commit per numbered task. When the work is done, run the
full build, push with `git push -u origin community-plugin-submission`, and
open a PR against main with `gh pr create`. Describe what shipped and what the
spec deferred.

The other session owns src/test-support/builders.ts and src/wiring/plugin-scope.ts
for its own changes. Commit 7 touches both. Expect a conflict there at merge and
keep that commit small, rather than trying to avoid the overlap.
```
