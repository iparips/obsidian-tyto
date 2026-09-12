---
created: 2026-09-12
updated: 2026-09-12
---

# Tyto Logo: Spec

Ships the barn owl mark. The plugin was renamed from Owl to Tyto and the mark
was drawn, but nothing uses it: three sites still register the built-in mic
icon, and the README carries no image at all.

- [0-prompt.md](0-prompt.md) - the block handed to a fresh agent that will build it
- [2-requirements.md](2-requirements.md) - the two assets, and what each must do
- [3-design.md](3-design.md) - where the glyph lives, the redraw, and the README change
- [4-tasks.md](4-tasks.md) - build order in three commits, and what to watch

A microphone is the wrong mark. The README's opening paragraph says Tyto treats
speech as an instruction rather than dictation, and the icon above it says
dictation.

Two assets rather than one, because the mark does not scale down. At ribbon size
the cream helmet washes out on a light theme and the eye slits merge into the
disc. So the ribbon gets a redrawn one-colour glyph in currentColor, and the
README gets the full-colour PNG, where size is free.

The redraw keeps the helmet, the disc and the eyes, and drops the beak: at 18
pixels it fills the gap between the eyes and turns the disc into a blob. It is
one filled shape with the face knocked out of it, not two stroked outlines,
which at ribbon size fuse into a blob of their own.

The change in src is small. One module owns the icon name and its markup, and
the three sites that spell mic today use that constant instead.

[Resources](Resources/) holds the chosen mark, tyto-mask-heart.svg, beside the
variants it was picked from and the gallery used to compare them. It also holds
tyto-ribbon-glyph.svg, the glyph as shipped, which is what the ribbon renders.

The chosen mark carried a drawing fault: its facial disc hung through the bottom
of the head, which the dark PNG hid. That is corrected, and the design records
it.
