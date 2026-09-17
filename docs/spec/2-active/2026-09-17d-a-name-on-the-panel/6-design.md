---
created: 2026-09-17
updated: 2026-09-17
---

# Design

Three files change and one is added. PanelHeader gains a title, styles.css
splits the row, and the glyph moves so both React and Obsidian can reach it.

## Where the glyph lives

tyto-icon.ts sits in views/obsidian/ and calls addIcon, so a React component
cannot import it: the module runs Obsidian's API on load.

The path data moves to TytoOwl (session/views), a component under views/ that
renders the mark as an svg. It carries the comments explaining why the mark is
one filled path, since those belong with the path data.

tyto-icon.ts then imports the same string and keeps registering it, so the
ribbon and the tab are unchanged. The path markup is a private constant there
today, so the move makes it exported and the file keeps only addIcon and the
name. The component wraps it in an svg with a viewBox; addIcon takes it bare.

TYTO_ICON stays where it is and keeps its name. Three call sites import it, in
main.ts for the ribbon and the command and in session-view.tsx for the leaf, and
none of them changes.

```text
views/TytoOwl.tsx          TYTO_OWL_PATHS, and the component rendering them
views/obsidian/tyto-icon.ts  imports TYTO_OWL_PATHS, registers tyto-owl
```

The svg takes width and height from the font size and fills with currentColor,
so it follows the header's text colour in both themes.

## The header row

PanelHeader renders a title block before the buttons:

```text
tyto-header
  tyto-header-title    TytoOwl, then the words Tyto session
  tyto-header-actions  Copy, Reset
```

The buttons keep their classes, their labels, their aria-labels and their
disabled rules. Nothing about them changes but their position in the tree.

The title is not a button and takes no props. It says the same thing in every
state of the panel, so a component that renders a constant needs nothing passed
to it.

## The stylesheet

tyto-header already has display flex, align-items centre and a gap. The title
block takes the same, so the glyph and the words sit on one baseline.

The actions block takes margin-left auto, which pushes it to the right edge and
leaves the spare width between the two blocks. Both blocks keep their intrinsic
width, per D2, so neither shrinks when the sidebar is dragged narrow.

tyto-header's font-weight already covers the title, so the words need no rule of
their own. The existing button rules stay where they are.
