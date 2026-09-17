---
created: 2026-09-17
updated: 2026-09-17
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec. The design and
tasks are written and both decisions are resolved, so nothing in it is open.

```text
Build the spec in docs/spec/2-active/2026-09-17d-a-name-on-the-panel. The
session panel's header is two buttons and no label; it gains an owl glyph and
the words Tyto session on the left, with the buttons moved right.

Read 9-tasks.md first: it is two commits, and it names what each one touches.
Then 6-design.md before commit 1, since it holds the split that lets a React
component draw a glyph tyto-icon.ts registers with Obsidian. Read 8-unit-tests.md
with it. Leave 3-requirements.md and 4-decisions.md until you need the reasoning.

Repo conventions are in AGENTS.md, and the code-generation and code-unit-tests
skills own the rest. Commit as you go, and leave the whitespace the build
reformats in its own commit.

Three things to verify rather than trust. That the three cases already in
tyto-icon.test.ts pass unedited, especially the one asserting the registered
markup carries no svg wrapper: it is what says the shared constant is the bare
paths and the wrapper is the component's. That every case already in
PanelHeader.test.tsx passes unedited, since the buttons keep their aria-labels
and only move in the tree. And that TYTO_ICON's three importers still compile
untouched, two in main.ts and one in session-view.tsx: the name stays put, and
only the path markup moves out from under it.

The suite cannot judge the layout. jsdom applies no stylesheet, so whether the
buttons sit at the right edge, whether the owl reads at header size in both
themes, and whether a narrow sidebar clips anything are all in
5-acceptance-criteria.md and are Ilya's to run in a real vault. Say so when the
code is done rather than claiming the header is right.

If the spec is wrong, fix the spec and say what changed rather than building
around it.
```
