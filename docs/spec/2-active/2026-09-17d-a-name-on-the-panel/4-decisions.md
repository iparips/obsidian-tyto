---
created: 2026-09-17
updated: 2026-09-17
---

# Decisions

## Requirements

### Decisions

#### D1: How does the glyph reach a React header? [resolved 2026-09-17]

By moving the path data into a module under views/ that the header renders as an
inline svg. Ilya chose it.

| Option                        | Cost                                                     |
| ----------------------------- | -------------------------------------------------------- |
| Inline svg in views/          | Chosen                                                   |
| setIcon through a prop        | A port carried through the panel for one glyph            |
| A second copy of the path     | Two marks that drift apart on the next edit               |

Nothing outside views/ imports React and nothing in views/ may reach Obsidian,
so a header that names an icon id has no way to render it. setIcon would work
through a callback prop supplied by the obsidian/ layer, but that threads a port
through SessionPanel for a decoration.

The path data stays in one place. The module under views/ owns it, and
tyto-icon.ts imports the same string to register with Obsidian, so the ribbon,
the tab and the header cannot disagree.

#### D2: Does the title truncate when the panel is narrow? [resolved 2026-09-17]

No. Ilya chose it: the title is two words and a glyph, which fits beside Copy
and Reset at any width a sidebar is usable at.

The rule this sets is on the wording rather than the layout. A title long enough
to need an ellipsis is the wrong title, so the fix for a clipped header is
shorter text and never a threshold that hides it.

The buttons do not shrink either. Both take their intrinsic width, and the
spare room in the row sits between the title and them.

### Assumptions

- Tyto session is the right wording, because the leaf already uses it in getDisplayText. A header that said something else would give one panel two names.
- The header keeps its border and its padding. Only the row's contents change, so the panel below it does not move.
