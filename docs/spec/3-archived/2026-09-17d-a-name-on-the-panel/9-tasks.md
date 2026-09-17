---
created: 2026-09-17
updated: 2026-09-17
---

# Tasks

Two commits, in order. Each leaves the suite green.
[6-design.md](6-design.md) owns the shape of the change, and
[8-unit-tests.md](8-unit-tests.md) owns the tests each commit brings.

## 1. Move the owl where React can draw it

No behaviour change. src/session/views/TytoOwl.tsx (new) and
src/session/views/obsidian/tyto-icon.ts.

- Add TytoOwl, exporting the path markup as a constant and a component that
  wraps it in an svg with the 0 0 100 100 viewBox.
- Carry the comments explaining the mark across with the path data.
- Point tyto-icon.ts at the constant. It keeps addIcon and keeps passing the
  markup bare, since Obsidian supplies its own wrapper.

Tests: the new registerTytoIcon case. The three already there pass unedited, and
the wrapper case is the one that proves the split is right.

Done when the ribbon and the tab still show the owl in a real vault.

## 2. Put a title in the header

The change. src/session/views/PanelHeader.tsx and styles.css.

- Render a title block holding TytoOwl and the words Tyto session, before the
  buttons.
- Wrap Copy and Reset in an actions block. Their props, labels and disabled
  rules do not change.
- Add the two class rules per the design: the title block lays its glyph and
  text out, and the actions block takes margin-left auto.

Tests: the three PanelHeader cases in 8-unit-tests.md. Every case already in
that file stays unedited.

Done when the header reads as a header at both sidebar widths, which is
[5-acceptance-criteria.md](5-acceptance-criteria.md) and Ilya's to run.
