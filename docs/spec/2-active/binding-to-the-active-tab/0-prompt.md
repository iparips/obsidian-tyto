---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Fix the session binding to the active tab, specified in
docs/spec/2-active/binding-to-the-active-tab.

Read 1-index.md, then 2-requirements.md, then 5-tasks.md. 4-decisions.md holds
one resolved decision and three assumptions; read it if a choice looks
arbitrary. 3-design.md describes commit 1, which is already landed.

Load the code-generation and code-unit-tests skills before the first commit.
Repo conventions are in docs/AGENTS.md. Read it before the first commit.

Commit 1 is already landed: the signatures are widened and bindTo has replaced
changeTargetNote. Start at commit 2.

Verify before trusting:
- The spec says changeTargetNote collapses into bindTo. That has happened, so
  read session-repository.ts rather than the design's snippet of it.
- EditEngine.followActiveNote returns early on an unchanged path. Confirm null
  to null is a no-op, so a second empty tab publishes nothing.

The unit suite cannot tell you whether Obsidian fires file-open for a tab
holding no file. Check it in a real vault: open a note, start a session, open an
empty tab, and confirm the header clears. If it does not, the event is not
firing and the subscription needs another source. Report that rather than
guessing at one.

If the spec is wrong, say so and fix the spec. Do not build around it.
```
