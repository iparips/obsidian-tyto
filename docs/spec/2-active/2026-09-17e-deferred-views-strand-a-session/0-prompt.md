---
created: 2026-09-17
updated: 2026-09-17
---

# Implementation Prompt

Hands the build to a fresh session. Every decision is settled, so nothing here
waits on an answer. Paste the block below, or run new-agent-tab on this file.

```text
Build the spec in docs/spec/2-active/2026-09-17e-deferred-views-strand-a-session:
a session refuses its second utterance because Obsidian 1.7.2 defers background
views, and three places read a markdown leaf's view as though it always has a
file and an editor.

Read 1-index.md, then 5-design-deferred-leaves.md, then 3-decisions.md. The
design's Rollout section is the build order. Read 6-unit-tests.md before the
first commit that adds a test rather than up front: it opens with the three
things FakeWorkspace needs, and those are rollout step 3. 2-requirements.md
narrates the failure and is optional. Read 4-acceptance-criteria.md at the end.

The repo's conventions are in CLAUDE.md, and docs/architecture/6-reaching-a-note.md
owns note-binding. Read it before moving anything there.

Verify these before trusting them. All were read on 2026-09-17.
- manifest.json now says minAppVersion 1.13.0 and versions.json maps 0.1.0 to
  it. Both landed on main ahead of this work, so rollout step 2 is already done.
- WorkspaceNoteLocator.locate has exactly two production callers,
  target-note-resolver.ts:38 and target-note-writer.ts:72. A third would change
  what D3 weighed.
- FakeNoteLocator extends the real locator and overrides locate, so the async
  signature reaches src/test-support and not only src/engine.

bun run test is the check. Do not run bun run build: it reformats the whole repo
and writes main.js. The suite is 1343 tests green today, and it cannot see this
bug at all until step 3 lands, so a green run before then proves nothing.

The end-to-end check is a judgement the suite cannot make: on a real vault with
a real key, background the target note's tab and speak a second utterance. The
edit must land with undo intact and nothing on screen may move. Mobile matters
most, because the panel holds the screen there.

If the spec is wrong, say so and fix it rather than building around it. D7
already corrects D5 that way, so the folder has the shape for it.
```
