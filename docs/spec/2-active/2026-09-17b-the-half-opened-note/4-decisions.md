---
created: 2026-09-17
updated: 2026-09-17
---

# Decisions

## Requirements

### Decisions

#### D1: How does a read know it can trust the handle? [resolved 2026-09-17]

By comparing the editor's text against the file at the path its view reports.
Ilya chose it. The handle is trusted where the two agree, and the read falls
back to the vault where they do not.

| Option                              | Cost                                                      |
| ----------------------------------- | --------------------------------------------------------- |
| Compare the text at each read       | Chosen                                                    |
| Wait longer before capturing        | Fixes the capture, not a handle that goes stale later     |
| Always read the body from the vault | Loses unsaved text the editor holds and the file does not |

A guard where the handle is used, not a longer wait before it is captured. The
reported session lost the race at capture, but a handle can go stale later too,
and only a check at the point of use catches both.

Reading from the vault always would remove the class of bug outright. Rejected
for the unsaved text it discards: the editor is the only place recent typing
exists, and a note without it is a smaller bug of the same kind.

[6-what-obsidian-tells-us.md](6-what-obsidian-tells-us.md) holds the API
exploration and the two states this cannot separate.

#### D2: Does the reader ever learn this happened? [resolved 2026-09-17]

The edit line already says a write took the vault path, and that is enough. Ilya
chose it: a reader who sees the write went to the file learns what they can act
on, and the cause matters less than the consequence.

One change follows, in the panel alone. The panel names the cause today, and
that cause is now one of two:

```text
Edit applied directly. Undo not available - because editor moved to another note
```

A mismatched file is not a moved tab, so the wording has to cover both or name
neither. The design names neither. The transcript needs no change: it already
writes `written directly, undo not available`, which names no cause.

### Assumptions

- The view reported the target's path while its editor still held the previous
  note. That is the only state where the locator returns the turn's handle and
  the body is another note's. If a probe shows a different handle was returned,
  the existing guard is broken rather than bypassed and the fix moves.
- An editor whose text matches the file at its view's path has finished loading
  it. Obsidian states no such signal, so this is an inference. If a view can
  match and still swap afterwards, the check passes too early.
- The suite can catch the writer's half of this, and no more. The chosen check
  compares the editor against the file, not against the view, and a test builds
  that disagreement today: FakeNoteLocator returns the turn's handle for the
  target's path while FakeVault holds different text at it. What no fake builds
  is the view's own tearing, so the suite proves what the writer does in the
  state and never that Obsidian reaches it. A probe settles the second. Stubbing
  such a check to return true left all 1319 tests green, which is why the tests
  assert what the writer returned rather than the predicate.
