---
created: 2026-09-17
updated: 2026-09-17
---

# Tasks

Four commits, in order. Each leaves the suite green.
[design/1-index.md](design/1-index.md) owns the shape of the change;
[8-unit-tests.md](8-unit-tests.md) owns the tests each commit brings.

## 1. Trust the handle only where its text matches the file

The fix. src/engine/note-editing/target-note-writer.ts.

- Extract readFile(path), the vault read that write and read already do.
- Rename tabStillShows to editorHoldsTheNote, make it async, and add the text
  comparison after the handle-identity test.
- Add tabShowsPath, the identity test alone, and point focusEdit at it.
- Await the new predicate in write and in read.
- Flush the view first where this turn already wrote through it, per
  [design/5-the-dirty-editor.md](design/5-the-dirty-editor.md). That reaches
  the locator, TurnRepository, TurnState and the three reading callers.

Tests: read, getDetails, write and focusEdit, per 8-unit-tests.md. Build the
half-opened view as the design shows; no fake changes.

The fakes do change, though not to build that view. A note open in an editor now
has to exist in the vault holding the same text, so anEngine mirrors the open
notes in and FakeNoteLocator gains a save.

Done when a half-opened view reads from the vault and writes to it, and the
moved-tab cases already in target-note-writer.test.ts still pass unedited.

## 2. Stop the panel naming a cause

D2. src/session/views/EntryProgress.tsx:37.

The line says undo is not available and names no cause, since a mismatched file
is not a moved tab. The transcript at transcript-entry-lines.ts:41 already names
none, so it is not touched.

Tests: the ProgressRow cases in 8-unit-tests.md, in
src/session/views/tests/EntryProgress.test.tsx.

## 3. Correct the spec

Two claims the code contradicts, plus one the design answers.

- 4-decisions.md, third assumption: a test can build a half-opened view, and how.
- 4-decisions.md, D2: the transcript already names no cause, so only the panel
  changes.
- 1-index.md: the design and tasks files, and that a guard against this is now
  testable.

## 4. Probe, then verify

Not code. Both need a real vault, a key and a mobile pass.

1. Run the probe in 3-requirements.md. Record what it shows in the spec even if
   it does not reproduce: a probe that fails to reproduce bounds the timing.
2. Run 5-acceptance-criteria.md, mobile included.

What the probe settles, and nothing in commits 1 to 3 does: whether the view
really reported the target's path while its editor held the previous note. If it
shows a different handle was returned, the existing guard is broken rather than
bypassed, and commit 1 guards a state that never happens. It would still be
correct, and the fix would move to the locator.

## Build

```bash
bun run test
bun run build
```

The build reformats the repo, so keep that whitespace in its own commit
(AGENTS.md).
