---
created: 2026-09-17
updated: 2026-09-17
---

# Unit Tests

The plan for [6-design.md](6-design.md). Layout is not asserted here: whether
the buttons sit at the right edge is a stylesheet question, and jsdom applies no
stylesheet. [5-acceptance-criteria.md](5-acceptance-criteria.md) holds that.

## PanelHeader

New cases, added to the existing describe blocks rather than replacing them.

```text
whatever the session is on
  names the session
  renders the owl
  names the session while a turn runs
```

The third case guards the one regression a reviewer would look for: the title is
a label, so nothing about a running turn removes it or greys it.

The owl case queries the svg by its title element rather than by class, since a
class is the stylesheet's and a test asserting one pins the wrong thing.

Every case already in PanelHeader.test.tsx stays unedited. The buttons keep
their aria-labels, so the queries finding them still find them.

## tyto-icon

Three cases already stand: registered under the name the call sites ask for,
drawn in currentColor, and carrying no svg wrapper. All three pass unedited if
the split is done as the design says, and the third is the one that constrains
it. The shared constant is the bare paths, so only the React component may add a
wrapper and a viewBox.

One case joins them:

```text
registerTytoIcon
  registers the shared paths, so the ribbon and the header draw one mark
```

That is the invariant the move puts at risk. Nothing else in the file changes.

## What no test covers

The glyph rendering legibly at 18 pixels. That is why tyto-icon.ts carries its
comments, and why the acceptance criteria ask for a look at the real panel.
