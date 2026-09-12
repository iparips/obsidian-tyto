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
4. [Drawing the ribbon glyph](#drawing-the-ribbon-glyph)
5. [The README image](#the-readme-image)
6. [Test plan](#test-plan)
7. [Out of scope](#out-of-scope)
8. [References](#references)

## Goal

Ship the mark at two sizes. One constant names the icon, three call sites use
it, and the README opens with the full-colour version.

## Where the assets live

Two homes, because the files have different jobs.

| File                                | Home            | Role                          |
| ----------------------------------- | --------------- | ----------------------------- |
| tyto-mask-heart.svg                 | docs/spec/23... | The chosen design, unchanged  |
| src/session/views/tyto-icon.ts      | src             | The glyph markup the plugin registers |
| docs/assets/tyto-logo.png           | docs/assets     | The README image              |

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

## Drawing the ribbon glyph

The two-tone mark does not survive the reduction. Rendered at ribbon size the
cream helmet disappears against a light theme, and the eye slits merge into the
disc. The glyph is therefore redrawn rather than reused (FR3, FR4).

Three rules carry the redraw:

- Strokes, not fills, for the helmet and the disc. A filled cream shape has
  nothing to fill with once the palette drops to one colour.
- currentColor everywhere, so the icon inherits the theme the way its neighbours
  do. No hex value appears in the shipped markup.
- Eyes stay filled. They are the smallest shapes and the first to vanish if
  drawn as outlines.

A tested starting point, which reads at 18 pixels:

```xml
<g fill="none" stroke="currentColor" stroke-width="7"
   stroke-linejoin="round" stroke-linecap="round">
  <path d="M50 12C30 12 16 27 16 48v17c0 3 2 5 4 6l27 15a7 7 0 0 0 6 0l27-15c2-1 4-3 4-6V48C84 27 70 12 50 12Z"/>
  <path d="M50 40c-5-8-15-9-21-3-7 7-8 18-3 28 4 10 13 19 24 25 11-6 20-15 24-25 5-10 4-21-3-28-6-6-16-5-21 3Z"/>
</g>
<path fill="currentColor" d="M31 57c6-2 11 0 13 4 1 3 0 5-3 5-4 0-9-3-11-6-1-2 0-3 1-3Z"/>
<path fill="currentColor" d="M69 57c-6-2-11 0-13 4-1 3 0 5 3 5 4 0 9-3 11-6 1-2 0-3-1-3Z"/>
```

The beak is dropped. At 18 pixels it fills the gap between the eyes and turns
the disc into a blob, and the mark is recognisable without it.

Stroke width 7 is heavier than the source's 5, because a stroke thins as the
icon shrinks. It is the number to adjust first if the icon reads light beside
Obsidian's built-ins.

## The README image

The existing PNG is 2048 by 2048, which is far more than a README needs and
larger than belongs in a clone (NFR3). A copy scaled to about 512 pixels goes in
docs/assets, and the source stays in the spec folder.

The README opens with the image above the title, centred, at a width that does
not push the prose down the page (FR6, FR7, FR8):

```html
<p align="center">
  <img src="docs/assets/tyto-logo.png" alt="Tyto" width="200">
</p>
```

HTML rather than markdown, because markdown cannot centre an image or set a
width, and GitHub renders both. The relative path resolves on GitHub and in a
local preview.

The README's prose needs no change (FR9). The rename commit corrected the title
and the body, so this change adds the image and nothing else.

## Test plan

The icon is markup and registration, so most of it is verified by eye. Two
things are worth an assertion.

| Check                         | How                                    |
| ----------------------------- | -------------------------------------- |
| One name, three sites         | Unit: no site passes a literal string  |
| Registered before use         | Unit: onload registers before ribbon   |
| Legible at 18 px              | By eye, in the ribbon, both themes     |
| Reads beside Obsidian's icons | By eye, in the ribbon, both themes     |
| README renders on GitHub      | By eye, after push                     |

The by-eye checks are the real test, and both themes matter: a glyph tuned on
dark can vanish on light. The manual-tests folder is where the steps go.

## Out of scope

- Community plugin submission assets. Those want their own sizes and a
  screenshot, and belong with that spec under Upcoming.
- An icon that changes with session state.
- A light and dark pair of README images.
- Any change to the mark itself. The design is settled.

## References

- [2-requirements.md](2-requirements.md) - open first, for what each FR asks
- Resources/tyto-mask-heart.svg - the chosen mark, and the source of the glyph
- Resources/icon-variants.html - the earlier variants, and how they were compared
- src/main.ts:26 - the ribbon and command registration, two of the three sites
- src/session/views/session-view.tsx:37 - getIcon, the third site
- README.md:1 - the top of the file, where the image goes
