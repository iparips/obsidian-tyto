---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Fix the session binding to the active tab, specified in
docs/spec/2-active/binding-to-the-active-tab.

Read 1-index.md, then 2-requirements.md, then 5-tasks.md. Read 3-design.md
before commit 1, since it names the four signatures that widen. 4-decisions.md
holds one resolved decision and three assumptions; read it if a choice looks
arbitrary.

Repo conventions are in docs/AGENTS.md. Read it before the first commit.

A sibling spec, docs/spec/2-active/recording-a-retarget, edits the same method
in EditEngine. Commit 1 here is the one it waits on, so land it before anyone
starts that spec's commit 2.

Verify before trusting:
- EditEngine.followActiveNote returns early on an unchanged path. Confirm
  targetNote() returns string or null, so null to null is still a no-op.
- ToolDispatcher calls changeTargetNote with a path. Confirm widening the
  parameter leaves it untouched.
- useTargetNote calls NoteName.of on the retargeted path. Confirm it is not
  called with null once the channel carries one.

The unit suite cannot tell you whether Obsidian fires file-open for a tab
holding no file. Check it in a real vault: open a note, start a session, open an
empty tab, and confirm the header clears. If it does not, the event is not
firing and the subscription needs another source. Report that rather than
guessing at one.

If the spec is wrong, say so and fix the spec. Do not build around it.
```
