---
created: 2026-09-17
updated: 2026-09-17
---

# A Name on the Panel

## Motivation

The panel header holds two buttons and nothing else. Copy and Reset sit at the
left edge of an otherwise empty row, and nothing on screen says what the panel
is.

The tab already carries the owl and the words Tyto session, but a sidebar leaf
shows its icon alone once the tab strip is narrow, and a panel pinned open all
day is read without the strip being looked at. The header is the one place that
can say it without the user hovering anything.

Two buttons at the left also read as a stray toolbar rather than a header. A
title on the left and controls on the right is the shape every other Obsidian
leaf uses, so the row reads as a header once it has one.

## In Scope

### The title

An owl glyph followed by the words Tyto session, at the left of the header row.
The same wording the leaf's display text uses, so the panel and the tab agree.

The glyph is the mark registered as tyto-owl, rendered in the header rather than
named. Nothing in views/ may call Obsidian, so the header cannot ask for an icon
by id.

### The controls

Copy and Reset move to the right of the row and keep everything else they have:
their labels, their disabled rules, and Copy's absence when the setting is off.
This spec changes where they sit, not what they do.

### The narrow panel

Two words and a glyph fit beside two small buttons at every width a sidebar is
usable at, so the title is not truncated and no threshold hides it. The
constraint runs the other way: the title stays short enough to fit, and the
buttons never shrink to make room for it.

## Out of Scope

- The note a turn targeted. It sits on the turn, decided in the tidy-up-chat-panel spec, and this spec does not bring it back to the header.
- The tab's own title and icon. Both already exist in session-view.tsx and are unchanged.
- Any new control. The header gains a label, not a menu.

## References

### Task

- [src/session/views/PanelHeader.tsx](../../../../src/session/views/PanelHeader.tsx) - open first: the row the title joins, and the two buttons it sits beside
- [src/session/views/obsidian/tyto-icon.ts](../../../../src/session/views/obsidian/tyto-icon.ts) - the glyph, and the comments explaining why it is one filled path
- [src/session/views/obsidian/session-view.tsx](../../../../src/session/views/obsidian/session-view.tsx) - getDisplayText, the wording the header matches
- [styles.css](../../../../styles.css) - tyto-header, and the note saying why it became a toolbar
- [src/session/views/tests/PanelHeader.test.tsx](../../../../src/session/views/tests/PanelHeader.test.tsx) - the cases the change must leave passing

### Project

- [tidy-up-chat-panel](../../3-archived/2026-09-03c-tidy-up-chat-panel/1-index.md) - took the note name out of this header, and why the row is a toolbar today

### Architecture

- [architecture/1-overview.md](../../../architecture/1-overview.md) - the rule that only src/wiring constructs across packages, and that only views/ imports React
