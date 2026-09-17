---
created: 2026-09-17
updated: 2026-09-17
---

# Unit Tests

The plan for [design/1-index.md](design/1-index.md). The checks a person runs by hand are in
[5-acceptance-criteria.md](5-acceptance-criteria.md), since no fake proves
Obsidian reaches a torn view.

Every case below asserts what the writer returned or wrote, never the predicate.
A stubbed predicate left the suite green once already (4-decisions.md), so a
test naming it would repeat that mistake.

## TargetNoteWriter

The half-opened view a test builds is in
[design/3-testing-it.md](design/3-testing-it.md): the locator
returns the turn's handle, and the vault holds different text at that path.

### read

```text
located handle differs from the one held
  returns the file at the path
located handle is the one held
  editor text equals the file
    returns the editor text
  editor text differs from the file
    returns the file at the path
  path is not a note in the vault
    returns the empty string
```

The third condition is the new one. It reads as the half-opened view and as an
editor with unsaved text alike, which is the design's accepted cost. Two tests
asserting that unsaved text reaches the model say the opposite now, one in
edit-engine-note-context.test.ts and one in harness-tools-read.test.ts.

### getDetails

```text
editor text differs from the file
  the details carry the file's body under the note's path
```

One case only: getDetails delegates to read, so its branches are read's. This is
the defect stated as the model sees it, so it is worth a test of its own.

### write

```text
located handle differs from the one held
  writes the target through the vault
  reports wroteThrough vault
editor text differs from the file
  writes the target through the vault
  leaves the editor's stale text untouched
  reports wroteThrough vault
  refuses an anchor the file does not hold
editor text equals the file
  writes through the editor
  reports wroteThrough editor
```

The second condition is new, and mirrors the moved-tab cases already in
target-note-writer.test.ts. The stale-text leaf is what stops the write reaching
the note the editor is still showing.

## The Turn's Second Edit

Already covered by edit-engine.test.ts, which fails without the flush in
[design/5-the-dirty-editor.md](design/5-the-dirty-editor.md).

```text
a turn edits the same note twice
  the second edit reaches the note the first one left
```

No new test: the case was there before this spec and is what caught the
regression. It is listed because it is the only assertion the flush is for.

### focusEdit

```text
located handle differs from the one held
  does not scroll
located handle is the one held
  editor text equals the file
    scrolls to the position
  editor text differs from the file
    scrolls to the position
```

The last leaf records the deliberate asymmetry: focus keeps the identity test
alone, so a half-opened view is still scrolled. A test asserting it stops a
later change quietly making focusEdit async.

## EntryProgress

### ProgressRow

```text
line wrote direct
  says undo is not available
  names no cause
line wrote through the editor
  says nothing about undo
```

The cause-free wording is D2. The second leaf keeps the existing assertion, so
the wording change does not silently start marking every line.
