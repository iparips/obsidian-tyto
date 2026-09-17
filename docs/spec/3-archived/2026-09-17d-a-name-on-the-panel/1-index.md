---
created: 2026-09-17
updated: 2026-09-17
---

# A Name on the Panel: Spec

The session panel's header holds two buttons at its left edge and nothing else.
Nothing on screen says what the panel is.

This adds a title: the owl glyph and the words Tyto session on the left, with
Copy and Reset moved to the right. The leaf already uses that wording, so the
header and the tab agree.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [3-requirements.md](3-requirements.md) - what the header says today, what it gains, and what stays out of it
- [4-decisions.md](4-decisions.md) - how the glyph reaches React, and why the title never truncates
- [5-acceptance-criteria.md](5-acceptance-criteria.md) - the looks at a real panel, since jsdom applies no stylesheet
- [6-design.md](6-design.md) - the three files that change, the one that is added, and the two class rules
- [8-unit-tests.md](8-unit-tests.md) - the cases per component, and the one invariant the icon move puts at risk
- [9-tasks.md](9-tasks.md) - two commits: move the glyph, then title the header

Both decisions are settled, so nothing here is open.

The interesting constraint is the glyph. It lives in views/obsidian/ and calls
addIcon on load, so a React component cannot import it. The path data moves into
views/, and tyto-icon.ts imports it back to register with Obsidian, which is
what keeps the ribbon, the tab and the header drawing one mark.

Downstream of
[tidy-up-chat-panel](../../3-archived/2026-09-03c-tidy-up-chat-panel/1-index.md),
which took the note name out of this header and left it a toolbar.
