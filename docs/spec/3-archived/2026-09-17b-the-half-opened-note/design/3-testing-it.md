---
created: 2026-09-17
updated: 2026-09-17
---

# How a Test Reaches a Half-Opened View

The spec records this as a problem without an answer, so the fix would otherwise
ship unverified. The third assumption in
[4-decisions.md](../4-decisions.md) said no fake can build a half-opened view.
That was true of a check comparing the editor against the view. The chosen check
compares it against the file, and both halves are already fakeable.

```ts
const stale = new FakeEditor('# Session transcript')
const locator = new FakeNoteLocator().withOpenNote(TARGET, stale)
const vault = new FakeVault().withNote(TARGET, '- milk')
```

The locator returns the turn's handle for the target's path, and the vault holds
different text at that path. That is the reported session exactly: right path,
wrong body, same handle. No new fake, and no change to FakeNoteLocator or
FakeEditor.

## What No Test Can Prove

The fakes cannot build the view's own tearing, so a test cannot show Obsidian
reaches this state. It shows what the writer does once it has.

Three things settle the rest, in order.

- The probe in [3-requirements.md](../3-requirements.md) says whether the view
  really reported the target's path while its editor held the previous note.
- [5-acceptance-criteria.md](../5-acceptance-criteria.md) confirms the fix in a
  real vault, mobile included.
- A probe that fails to reproduce still bounds the timing, which is why
  [4-rollout.md](4-rollout.md) has it recorded either way.

The tests assert what the writer returned, never the predicate. Stubbing such a
check to return true left all 1319 tests green, and a test naming the predicate
would repeat that.
