---
created: 2026-09-12
updated: 2026-09-12
---

# Implementation Prompt: Tyto Logo

Paste the block below into a fresh session.

```text
Build the Tyto logo feature, specified in docs/spec/23-tyto-logo.

Read 1-index.md, then 2-requirements.md, then 4-tasks.md. Read 3-design.md
immediately before commit 1: it holds the glyph markup and the registration
shape, and both are what you write first.

Repo conventions are in AGENTS.md, and build commands in
docs/CONTRIBUTING.md. Read the first before writing any source file.

Verify before trusting:

- That the three sites named in the design still pass the string mic, and that
  no fourth has appeared. Grep for addRibbonIcon, getIcon and the command's
  icon field.
- That Obsidian's addIcon still takes inner markup on a 0 0 100 100 grid.
- That the README has no image block already.

The end-to-end check the unit suite cannot make is the whole of commit 1. The
glyph in the design has only ever been rendered at 128 pixels in a file
previewer. Install the plugin, open Obsidian, and look at the ribbon at its
real size in both light and dark. Tune the markup until it sits with the icons
either side of it. Expect to change it: the design says which knob to turn
first, and what to drop next if the silhouette reads busy.

If the spec is wrong, say so and fix the spec, rather than building around it.
The glyph is the likely case, since it ships untested at size, and Resources
must end up holding what shipped.
```
