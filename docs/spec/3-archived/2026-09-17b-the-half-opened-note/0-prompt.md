---
created: 2026-09-17
updated: 2026-09-17
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec. The design and
tasks are written, and both decisions are resolved, so nothing in it is open.

```text
Build the spec in docs/spec/2-active/2026-09-17b-the-half-opened-note. A command
opens a note, and the model is shown a different note's body under its path.

Read 9-tasks.md first: it is four commits, and it names what each one touches.
Then design/1-index.md and design/2-the-check.md before commit 1, since the
second holds the shape of the predicate and why focus keeps the old one. Read
8-unit-tests.md and design/3-testing-it.md with it, in the same commit: the
second says how a test builds a half-opened view, which is the thing the suite
could not do before. Leave 3-requirements.md, 4-decisions.md and
6-what-obsidian-tells-us.md until you need the reasoning; they are why, not what.
Read design/4-rollout.md before commit 4.

Repo conventions are in AGENTS.md, and the code-generation and code-unit-tests
skills own the rest. Commit as you go, and leave the whitespace the build
reformats in its own commit.

The spec cites line numbers that move as you edit. Verify three things rather
than trusting them. That write and read are the only callers awaiting the new
predicate, and focusEdit still calls the identity test alone. That
note-edit-tool.ts's read-before-rewrite comparison still passes once read can
return the vault's text, since it compares that text against what the model was
shown. And that the moved-tab tests already in target-note-writer.test.ts pass
unedited: the new condition sits beside them and must not change them.

Two things the unit suite cannot judge. Whether an empty note now costs a vault
read where the editor would have done, which is accepted but worth seeing once.
And whether the fix holds in a real vault at all, which is what
5-acceptance-criteria.md and the probe in 3-requirements.md are for. Both need a
real vault, a key and a mobile pass, so they are Ilya's to run. Say so when the
code is done rather than claiming the defect is fixed.

If the spec is wrong, fix the spec and say what changed rather than building
around it.
```
