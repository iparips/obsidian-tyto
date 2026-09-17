---
created: 2026-09-17
updated: 2026-09-17
---

# The Half-Opened Note: Spec

A turn was asked to add items to the shopping list. A command opened it, and the
model was shown a different note's body under the shopping list's path.

A note becomes editable in stages. Obsidian points the view at the new file
before loading that file into the editor, and the wait guarding the gap settles
on the first of those. The turn captures a handle in between, then prints its
path from one half of the pair and reads its body through the other.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will design it
- [3-requirements.md](3-requirements.md) - the mismatch, why the vault fallback is bypassed, and the gap the wait settles in
- [4-decisions.md](4-decisions.md) - the text comparison that decides whether a handle is trusted, and what the panel says when it does not
- [5-acceptance-criteria.md](5-acceptance-criteria.md) - three checks, all needing a real vault
- [6-what-obsidian-tells-us.md](6-what-obsidian-tells-us.md) - which signals the API offers, and the two states a comparison cannot separate

The model refusing was luck: it was handed a body obviously unlike a shopping
list. Two similar notes would have gone through silently.

Not reproduced on demand, so a probe comes before a fix. The suite cannot help
with either: no fake here can build a view with the right path and the wrong
contents, and a guard against this passes its tests whether or not it works.

Both decisions are settled and the design is next.

Downstream of
[reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md),
whose vault fallback this reuses.
