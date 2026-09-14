---
created: 2026-09-12
updated: 2026-09-12
---

# Tasks: Tyto Logo

Build order in three commits. The glyph is tuned against the running plugin
before anything else lands, because that is the one thing a file previewer
cannot settle.

## 1. The glyph, tuned in the ribbon

The design's markup is a starting point rendered at 128 pixels in a file
previewer. It has never been seen in Obsidian at 18.

- Add src/session/views/tyto-icon.ts holding TYTO_ICON and the markup.
- Register it first in onload, before the ribbon is added.
- Point the ribbon, the command and the view's getIcon at the constant.
- Install, open Obsidian, and look at the ribbon in both themes.
- Adjust stroke-width until it sits with its neighbours. 7 is the starting
  value, and the first number to change if it reads light.

Exit: the icon is legible at 18 pixels in light and dark, and no site passes
the string mic.

## 2. The README image

- Create docs/assets, which does not exist yet.
- Scale the 2048px source into it with sips, which ships with macOS:

```bash
mkdir -p docs/assets
sips -Z 512 docs/spec/3-archived/23-tyto-logo/Resources/tyto-logo.png \
  --out docs/assets/tyto-logo.png
```

- Add the centred img block above the title.

The file is 512 pixels and the tag asks for 200, which is deliberate: the
extra pixels are what keep it sharp on a retina display.

Exit: the image renders on GitHub at a width that does not push the prose down
the page, and the repo carries no second copy of the 2048px file.

## 3. Record what shipped

- Add a manual test covering the ribbon icon in both themes.
- Update this spec if the glyph changed while being tuned, so Resources holds
  what shipped rather than what was proposed.

Exit: the shipped markup and the spec agree.

## What to watch

- The glyph is untested at size. Task 1 exists to settle it, and it may cost
  more than a stroke-width tweak: the beak is already dropped, and the tufts
  are the next thing to go if the silhouette reads busy.
- The scaling in task 2 is a one-off by hand. Nothing in the repo does image
  work, and sips is macOS-only: on another platform, use any tool that
  produces the same 512px file.
- tyto-logo.png is 2.4MB and already in history. Task 2 adds a scaled copy
  rather than replacing it, so the clone carries both.
