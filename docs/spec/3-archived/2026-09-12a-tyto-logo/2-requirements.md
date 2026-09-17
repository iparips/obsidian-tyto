---
created: 2026-09-12
updated: 2026-09-12
---

# Requirements: Tyto Logo

Put the barn owl mark where a user meets the plugin: the Obsidian ribbon, and
the top of the README.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [The two assets](#the-two-assets)
5. [Requirements](#requirements)
6. [Non-functional requirements](#non-functional-requirements)
7. [What the design must settle](#what-the-design-must-settle)

## Problem

The plugin was renamed from Owl to Tyto, and a mark was drawn for it, but
nothing ships it. Three registration sites still pass the built-in mic icon:
the ribbon button, the start-session command, and the session view's tab.

A microphone says dictation, which is the thing the README spends its opening
paragraph saying Tyto is not. The icon contradicts the pitch.

The README has no image at all. A reader arriving from the community plugin
list sees a wall of text where every other listing shows a mark.

Two assets are needed rather than one, because the mark does not survive being
scaled down. Rendered at ribbon size the cream helmet washes out against a light
theme and the eye slits merge into the facial disc.

## Goals

- Replace the mic at every site that registers it, so the ribbon, the command
  palette and the view tab agree.
- Keep the ribbon icon legible at 18 pixels, monochrome, following the theme.
- Put the full-colour mark at the top of the README, where size is free.
- Keep the mark's source in the repo, so a future change is an edit rather than
  a redraw.
- Change no prose. The rename already made the README say Tyto.

## Non-goals

- A plugin submission asset set. The community list wants its own sizes and a
  screenshot; that belongs with the submission spec under Upcoming.
- Animating the icon, or changing it by session state.
- A light and dark pair of README images. One image reads on both.
- Redrawing the mark. The design is settled; this ships it.
- Renaming anything. That landed with the rename commit.

## The two assets

They come from different sources and cannot be swapped.

| Asset  | Source              | Colour     | Size used |
| ------ | ------------------- | ---------- | --------- |
| Ribbon | tyto-mask-heart.svg | Monochrome | 18 px     |
| README | tyto-logo.png       | Two-tone   | ~200 px   |

The ribbon icon is redrawn from the chosen SVG as a single-colour glyph. The
README keeps the existing 2048px PNG, which already carries the cream-on-dark
treatment and needs no work beyond being committed and linked.

## Requirements

### The ribbon icon

FR1. Register the mark as a named Obsidian icon at load, before any site asks
for it by name.

FR2. Use that name at all three sites: the ribbon button, the start-session
command, and the session view's getIcon.

FR3. Draw the ribbon glyph in one colour that follows the theme, so it matches
the icons either side of it in light and dark.

FR4. Keep the glyph legible at 18 pixels: the helmet silhouette, the disc, and
two eyes must stay separable.

FR5. Keep the mark's proportions from the chosen SVG, so the ribbon icon and the
README image read as the same owl.

### The README

FR6. Show the mark at the top of the README, above the title.

FR7. Commit the image inside the repo and reference it by a relative path, so it
renders on GitHub and in a local preview.

FR8. Give the image alt text naming the plugin, since a reader on a screen
reader gets nothing from the mark itself.

FR9. Leave the README's prose alone. The rename already corrected it, so this
change adds an image and nothing else.

## Non-functional requirements

NFR1. The SVG source stays in the repo and stays hand-written, so the next
change is an edit to paths rather than a redraw.

NFR2. The ribbon glyph adds no dependency and no build step. It is markup the
plugin registers at load.

NFR3. The README image is small enough not to dominate a clone. The 2048px
source is larger than the README needs.

NFR4. Nothing about the icon reaches the settings file or the stored session.

## What the design must settle

- Where the glyph markup lives, and whether the three sites share one constant
  for its name.
- How the two-tone mark becomes a single-colour glyph: which shapes survive,
  and whether the helmet reads as a filled silhouette or an outline.
- Whether the README image is the 2048px PNG as it stands, a downscaled copy, or
  an SVG export, given NFR3.
- Where a committed README image belongs, given docs/spec holds specs rather
  than shipped assets.
