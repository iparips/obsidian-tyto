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

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [3-requirements.md](3-requirements.md) - the mismatch, why the vault fallback is bypassed, and the gap the wait settles in
- [4-decisions.md](4-decisions.md) - the text comparison that decides whether a handle is trusted, and what the panel says when it does not
- [5-acceptance-criteria.md](5-acceptance-criteria.md) - the checks a person runs, all needing a real vault
- [6-what-obsidian-tells-us.md](6-what-obsidian-tells-us.md) - which signals the API offers, and the two states a comparison cannot separate
- [design/1-index.md](design/1-index.md) - what the code says, the behaviour change, and the sub-files holding the check, its tests, its rollout and the flush
- [8-unit-tests.md](8-unit-tests.md) - the cases per method, all asserting what the writer returned
- [9-tasks.md](9-tasks.md) - four commits: the guard, the panel wording, the spec corrections, then the probe

The model refusing was luck: it was handed a body obviously unlike a shopping
list. Two similar notes would have gone through silently.

Not reproduced on demand, and the desktop probe after the fix did not reproduce
it either, so whether the state is the one described rests on a mobile run. The suite covers the writer's half: a test puts
the turn's handle over one text and the vault over another, which is the shape
the reported session had.

Both decisions are settled and the design is written. Building it found one
thing the design had not weighed: the plugin's own edit leaves the editor ahead
of the file for two seconds, so the guard needs a flush before it compares, and
must never flush the half-opened view it is there to catch.

Downstream of
[reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/1-index.md),
whose vault fallback this reuses.
