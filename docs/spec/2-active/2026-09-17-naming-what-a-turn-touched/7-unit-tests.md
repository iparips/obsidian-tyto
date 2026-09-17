---
created: 2026-09-17
updated: 2026-09-17
---

# Unit Tests

One entry per production method the design changes. The checks a person runs by
hand are in [5-acceptance-criteria.md](5-acceptance-criteria.md).

## ProgressLine

The note is a field, so the detail stops carrying it.

```text
a line built for a note
  holds the note apart from the detail
  leaves the path out of the detail text
a line built for no note
  holds no note, so nothing can differ from the target
```

## EntryProgress

Where the comparison happens, and the only place it does.

```text
a line whose note is the turn's target
  names no note, since the turn names it already
a line whose note differs from the turn's target
  names its note
a line carrying no note
  names none, whatever the target is
a turn on no note at all
  names the note of every line that carries one
```

The last case is the unbound session: there is no target to match, so a line
that touched a note has news and says it.

## PanelReducer

The user's move stops producing an entry, and the turn keeps its own.

```text
a tool moves the target
  the open turn names the new note
a retarget the user made
  appends nothing
  leaves the open turn as it stood
```

The second case replaces the sibling-entry test from
[reaching-a-note-by-path](../../3-archived/2026-09-16b-reaching-a-note-by-path/6-unit-tests.md),
since the entry it asserted no longer exists.

## TargetNoteWriter.write

The result says which path it took, which is all that changes here.

```text
the editor still shows the target
  reports the write went through the editor
the tab has moved to another note
  reports the write went through the vault
the target has no editor at all
  reports the write went through the vault
```

The writes themselves are unchanged and already covered by that spec's tests.

## ToolDispatcher.recordEdit

```text
an edit that went through the editor
  publishes the edit line
  publishes no warning
an edit that fell back to the vault
  publishes the edit line, as the editor path does
  publishes a warning naming the note
an edit that applied nothing
  publishes a refusal, and no warning
```

The last case is the anchor that did not match: no write happened, so there is
no path to report.
