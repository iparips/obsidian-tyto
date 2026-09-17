---
created: 2026-09-12
updated: 2026-09-12
---

# Design: Tyto Logo

Where the glyph markup lives, how the two-tone mark becomes a one-colour icon,
and what the README links to.

## Table of Contents

1. [Goal](#goal)
2. [Where the assets live](#where-the-assets-live)
3. [Registering the icon](#registering-the-icon)
4. [A fix to the source mark](#a-fix-to-the-source-mark)
5. [Drawing the ribbon glyph](#drawing-the-ribbon-glyph)
6. [The README image](#the-readme-image)
7. [Test plan](#test-plan)
8. [Out of scope](#out-of-scope)
9. [References](#references)

## Goal

Ship the mark at two sizes. One constant names the icon, three call sites use
it, and the README opens with the full-colour version.

## Where the assets live

Two homes, because the files have different jobs.

| File                           | Home            | Role                                  |
| ------------------------------ | --------------- | ------------------------------------- |
| tyto-mask-heart.svg            | docs/spec/23... | The chosen design, unchanged          |
| src/session/views/tyto-icon.ts | src             | The glyph markup the plugin registers |
| docs/assets/tyto-logo.png      | docs/assets     | The README image                      |

The spec folder keeps the design and its rejected siblings; it is a record of
what was decided. Shipped assets do not live there, which is what NFR3 and the
last open question in the requirements were asking.

The glyph is TypeScript rather than an imported .svg file. The repo bundles with
bun and has no SVG loader configured, so markup in a string costs nothing and
adds no build step (NFR2).

## Registering the icon

One module owns the name and the markup, so no call site spells either.

```ts
// src/session/views/tyto-icon.ts
import { addIcon } from 'obsidian'

export const TYTO_ICON = 'tyto-owl'

// Registered once at load. Obsidian injects the markup into its own svg
// element, so this is the inner content and carries no wrapper or viewBox.
export const registerTytoIcon = (): void => addIcon(TYTO_ICON, TYTO_ICON_SVG)
```

Obsidian's signature is addIcon(iconId, svgContent), and it wraps the content in
an svg element with a 0 0 100 100 viewBox. The chosen SVG is already drawn on
that grid, so the paths transfer with no rescaling (FR5).

Registration happens first in onload, before the ribbon is added, since a site
naming an unregistered icon renders nothing (FR1).

```ts
async onload(): Promise<void> {
  registerTytoIcon()
  ...
  this.addRibbonIcon(TYTO_ICON, 'Start Tyto session', () => this.openSession())
  this.addCommand({ id: 'start-session', name: 'Start session', icon: TYTO_ICON, ... })
}
```

The view's getIcon returns the same constant (FR2):

```ts
getIcon(): string {
  return TYTO_ICON
}
```

Three sites, one constant. That is the whole change in src.

## A fix to the source mark

The chosen mark had the facial disc ending at y=95 while the head ends at 89.1,
so the dark chin hung through the bottom of the cream silhouette. It is
invisible on the dark PNG the README uses and shows on any light ground.

The disc's last curve is pulled in so the chin sits inside the head, and the
beak moves up with it. The mark is otherwise untouched, and the ribbon glyph is
derived from the corrected paths.

The chin is lifted further than clearing the head requires. A chin that stops
just short leaves the helmet closing below it as a sliver a fifth of a pixel
wide at ribbon size, which antialiases into a detached grey dot rather than an
edge. Stopping at 81 leaves a band that renders as a solid pixel.

## Drawing the ribbon glyph

The two-tone mark does not survive the reduction. Rendered at ribbon size the
cream helmet washes out against a light theme, and the eye slits merge into the
disc. The glyph is therefore redrawn rather than reused (FR3, FR4).

Four rules carry the redraw:

- One filled shape, not two stroked outlines. At 18 pixels a stroked helmet and
  a stroked disc are concentric rings a pixel apart, and they fuse into a blob.
  The fill-rule knocks the disc out of the helmet, so the face is the gap.
- currentColor everywhere, so the icon inherits the theme the way its neighbours
  do. No hex value appears in the shipped markup.
- Eyes stay filled. They are the smallest shapes and the first to vanish.
- The glyph fills the grid the way its neighbours do, rather than keeping the
  source mark's own margins.

The shipped markup:

```xml
<path fill="currentColor" fill-rule="evenodd" d="M50 11.3C26 11.3 8.5 28.8 8.5 52.8v19.7c0 3.3 2.2 5.5 4.4 6.6l32.8 17.5a8.7 8.7 0 0 0 8.7 0l32.8-17.5c2.2-1.1 4.4-3.3 4.4-6.6V52.8C91.5 28.8 74 11.3 50 11.3ZM50 39.7c-6.6-9.8-19.7-10.9-27.3-3.3-8.7 8.7-9.8 22.9-4.4 34.9 5.5 9.8 17.5 18.6 31.7 20.7 14.2-2.2 26.2-10.9 31.7-20.7 5.5-12 4.4-26.2-4.4-34.9-7.6-7.6-20.7-6.6-27.3 3.3Z"/>
<g fill="currentColor">
  <path d="M26 59.4c7.6-2.2 14.2 0 17.5 4.4 2.2 3.3 2.2 6.6-1.1 7.6-4.4 1.1-9.8-1.1-14.2-4.4-3.3-2.2-5.5-5.5-5.5-6.6 0-1.1 1.1-1.1 3.3-1.1Z"/>
  <path d="M74 59.4c-7.6-2.2-14.2 0-17.5 4.4-2.2 3.3-2.2 6.6 1.1 7.6 4.4 1.1 9.8-1.1 14.2-4.4 3.3-2.2 5.5-5.5 5.5-6.6 0-1.1-1.1-1.1-3.3-1.1Z"/>
</g>
```

The beak is dropped. At 18 pixels it fills the gap between the eyes and turns
the disc into a blob, and the mark is recognisable without it.

Filling also sidesteps Obsidian's stroke width. The ribbon sets stroke-width
1.75px on the svg, sized for lucide's 24-unit grid; on this 100-unit grid that
is a hairline. A stroked glyph has to override it per element, which fights the
theme, and an override heavy enough to read at 18 pixels measures heavier than
every icon beside it.

Three numbers place the glyph in the ribbon. Two match the lucide icons
Obsidian ships; the first deliberately does not.

| Measure                   | Lucide neighbours | Shipped glyph |
| ------------------------- | ----------------- | ------------- |
| Width of the grid         | 75 per cent       | 83 per cent   |
| Centre of ink in the slot | 14.1 of 30        | 14.1 of 30    |
| Share of pixels inked     | 19 to 25 per cent | 26.4 per cent |

The glyph is drawn larger than its neighbours rather than level with them. It is
a mark rather than a pictogram, and it carries a head, a face and two eyes into
the same 18 pixels that a lucide icon spends on three or four strokes. At 75 per
cent it matched them and read small; 83 is where the face holds.

Ink follows the width past the band's top for the same reason: a filled shape
gains area faster than an outline as it grows.

Centring is done on the ink rather than the bounding box. The owl is widest at
the crown and narrows to a chin, so centring the box leaves its weight high and
opens a gap beneath it. In a ribbon, where buttons are evenly spaced, that gap
reads as uneven spacing rather than as a tall icon.

## The README image

The existing PNG is 2048 by 2048, which is far more than a README needs and
larger than belongs in a clone (NFR3). A copy scaled to about 512 pixels goes in
docs/assets, and the source stays in the spec folder.

The README opens with the image above the title, centred, at a width that does
not push the prose down the page (FR6, FR7, FR8):

```html
<p align="center">
  <img src="docs/assets/tyto-logo.png" alt="Tyto" width="200" />
</p>
```

HTML rather than markdown, because markdown cannot centre an image or set a
width, and GitHub renders both. The relative path resolves on GitHub and in a
local preview.

The README's prose needs no change (FR9). The rename commit corrected the title
and the body, so this change adds the image and nothing else.

## Test plan

The icon is markup and registration, so most of it is verified by eye. What a
suite can hold are the invariants that make the glyph render at all.

| Check                         | How                              |
| ----------------------------- | -------------------------------- |
| Registered under the name     | Unit: tyto-icon.test.ts          |
| Drawn in currentColor         | Unit: no hex value in the markup |
| No wrapper svg or viewBox     | Unit: Obsidian supplies both     |
| One name, three sites         | By eye: no site spells mic       |
| Legible at 18 px              | Manual: PS12, in the ribbon      |
| Reads beside Obsidian's icons | Manual: PS12, in the ribbon      |
| README renders on GitHub      | By eye, after push               |

Registration order is left to the reader of onload rather than asserted. A test
that registers a plugin to watch the call order needs an Obsidian Plugin fake
the repo does not have, and it would assert the line order of a five-line
method.

The by-eye checks are the real test, and both themes matter: a glyph tuned on
dark can vanish on light. PS11 and PS12 in the manual tests hold the steps.

## Out of scope

- Community plugin submission assets. Those want their own sizes and a
  screenshot, and belong with that spec under Upcoming.
- An icon that changes with session state.
- A light and dark pair of README images.
- Any change to the mark itself. The design is settled.

## References

- [2-requirements.md](2-requirements.md) - open first, for what each FR asks
- Resources/tyto-mask-heart.svg - the chosen mark, and the source of the glyph
- Resources/tyto-ribbon-glyph.svg - the glyph as shipped, on the same grid
- Resources/icon-variants.html - the earlier variants inlined, and how they were compared
- src/main.ts:26 - the ribbon and command registration, two of the three sites
- src/session/views/session-view.tsx:37 - getIcon, the third site
- README.md:1 - the top of the file, where the image goes
