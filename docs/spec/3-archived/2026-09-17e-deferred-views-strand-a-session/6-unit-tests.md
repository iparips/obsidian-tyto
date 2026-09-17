---
created: 2026-09-17
updated: 2026-09-17
---

# Unit Tests

The plan for [5-design-deferred-leaves.md](5-design-deferred-leaves.md). Every
check here runs against FakeWorkspace, which needs the deferred state described
below before any of them can fail for the right reason.

## What FakeWorkspace Needs

`getLeavesOfType` returns `{ view: { file: { path }, editor: {} } }` for every
path in `editorPaths`, so every leaf is loaded, holds a file and holds an
editor. No test can construct the state that breaks, which is why the suite has
been green throughout.

Three additions make it reachable:

- A `deferredPaths` set beside `editorPaths`, and a `defers(path)` builder that
  moves a path into it. A path in it is open in a tab that is not in front.
- `getLeavesOfType` answers a deferred path with a leaf shaped as Obsidian
  shapes one: `isDeferred` true, and a `view` holding neither `file` nor
  `editor`. That is the empty-object view the requirements reproduced against.
- `loadIfDeferred` on that leaf resolves, moves the path out of `deferredPaths`,
  and mutates the leaf's `view` to the loaded shape. Mutating rather than
  replacing is what makes the design's re-read assertable: a test can hold the
  leaf, await the load, and see the view it reads afterwards.

Two things the fake must also record, since they are what the narrowing claims:

- `loadedLeaves`, the paths `loadIfDeferred` was called on, in order. A test
  asserting the search stops at the first match reads this.
- `activeEditorPath`, with an `activeEditor` getter answering
  `{ editor }` for it and null otherwise, and an `isLookingAt(path)` builder.
  That is what the D6 guard compares against.

`FakeNoteLocator` extends the real locator and overrides `locate`, so its
override follows the signature to `async`. Nothing else in it changes: the
editors map already answers the open case and the absent case.

The fake still cannot produce a view that loads into something other than a
MarkdownView, so the instanceof miss is judged by reading the code rather than
asserted. It is named in the acceptance criteria instead.

## WorkspaceNoteLocator

### locate

```text
markdownPath(path) is false
  -> failure naming the reset

view = await findView(path)
  loaded leaves first: leaf where not isDeferred and view.file.path == path
  then deferred leaves, one at a time:
    await leaf.loadIfDeferred()
    re-read leaf.view
    stop at the first whose file.path == path
  none matched -> null

view == null -> success(OpenNote(null, path, cursorAtStart = line 0, ch 0))
otherwise    -> success(OpenNote(view.editor, path, view.editor.getCursor()))
```

```text
the note is open in a leaf that is not deferred
  answers an OpenNote holding that leaf's editor
  loads nothing, so the workspace keeps its deferred tabs
the note is open in a leaf that is deferred
  loads that leaf and answers an OpenNote holding its editor
  reads the view after the load, not the empty one before it
several leaves are deferred and one holds the note
  stops loading at the first leaf that matches
  leaves the deferred tabs after the match untouched
every leaf is deferred and none holds the note
  answers an OpenNote with a null editor rather than a failure
  loads every deferred leaf, since a miss is only known once
the note has no leaf at all
  answers an OpenNote with a null editor
  names the path on it, so a vault write knows where to go
the path is not a markdown note
  fails naming the reset, since no amount of loading gains an editor
  fails before loading anything, so a bound canvas costs no loads
```

The last pair is the existing `.base` coverage, kept and tightened: it asserts
the order as well as the message, which is what stops the markdown check
drifting below the search.

### saveOpenNote

```text
await findView(path)?.save()
```

```text
the note is open in a leaf that is not deferred
  saves that view
the note is open in a leaf that is deferred
  loads the leaf and saves the view it loaded
the note has no leaf
  saves nothing and does not throw
```

The deferred case matters more here than it looks. A save that silently found
nothing is what would put a note's own last edit out of a read that follows it.

## TargetNoteResolver

### resolveFor

```text
outcome = await noteLocator.locate(path)
outcome failed -> ResolutionFailed(path, outcome.message)
otherwise      -> TargetResolved(ResolvedNote(openNote, chain))
```

```text
the path resolves to an editor
  answers TargetResolved carrying that editor
  collects the AGENTS.md chain from the resolved note's folders
the path resolves without an editor
  answers TargetResolved rather than ResolutionFailed
  still collects the chain, since the folders are the path's not the editor's
the path is not a markdown note
  answers ResolutionFailed carrying the path
  answers ResolutionFailed carrying the reset message
  collects no chain, since nothing resolved to read folders from
```

The middle case is the one the existing tests assert the opposite of today, at
`target-note-resolver.test.ts:89-101`. Two of those three move to the
non-markdown path and the third inverts.

## TurnRunnerFactory

### build

```text
resolution = await targetNoteResolver.resolve()
resolution.hasFailed() -> Outcomes.failure('apply', resolution.reason)
otherwise              -> a runner over resolution.noteOrNull()
```

```text
the session's note has no editor
  builds a runner rather than refusing
  binds the turn to that note, so an edit reaches its path
the session's note is not a markdown note
  refuses, so the reset message reaches the user
the session names no note
  builds an unbound runner, as today
```

The first condition is the reported failure, stated at the level the user feels
it: the turn opens.

## TargetNoteWriter

### write

```text
await editorHoldsTheNote(note, wroteThroughEditor)
  -> writeThroughEditor, wroteThrough 'editor'
otherwise
  -> writeThroughVault, wroteThrough 'vault'
```

```text
the note carries a null editor
  writes through the vault
  reports wroteThrough vault, so the panel says undo is not available
  does not throw reading the null editor
the note carries an editor the locator still answers with
  writes through the editor, as today
the note carries an editor the tab has moved off
  writes through the vault, as today
the note carries a null editor and the file is gone
  reports not applied with reason noMatch
```

The last case is what the acceptance criteria reach as the deleted note: the
tool result says the anchor was not found, and the model ends the turn saying
so.

### focusEdit

```text
note.editor != null and note.editor == workspace.activeEditor?.editor
  -> noteEditor.focusEdit(note.editor, position)
otherwise -> nothing
```

```text
the user is looking at the note
  scrolls the edit into view and sets the cursor
the note is open behind the panel
  scrolls nothing and leaves the cursor where it was
the note is open in a background tab with another note in front
  scrolls nothing, since the active editor belongs to the other note
the note carries a null editor
  scrolls nothing and does not throw
```

The second and third are the same guard from the two sides the user meets it
from, mobile and desktop. Both are asserted here because only one of them is
reachable on each platform by hand.

## OpenedNoteWait

### hasEditor

```text
leaves.filter(leaf => leaf.view instanceof MarkdownView)
     .some(view => view.file?.path == path and Boolean(view.editor))
```

```text
a leaf holds the path with an editor mounted
  reports the editor present, so the wait finishes
a leaf holds the path with no editor yet
  reports it absent, so the wait polls again
a leaf holding the path is deferred
  reports it absent rather than throwing on the missing file
```

The third is the correction, and it is deliberately not a load. The wait is
polling a leaf Obsidian is mounting, and loading one would race that mount; a
deferred leaf here is simply not the leaf being waited for.

## NoteOpener

### open

```text
hasEditor(path) -> true
file missing or a folder -> false
otherwise await openedNoteWait.forOpen(reveal) and re-check
```

```text
the note already shows an editor
  answers true and opens nothing
a leaf holding the note is deferred
  opens the note, since a deferred leaf is not one showing an editor
the note is closed and opens
  answers true and records the open
the path names a folder
  answers false and opens nothing
```

The deferred case asserts the choice rather than a fix: `NoteOpener` reveals
into the active leaf, which loads the view anyway, so treating a deferred leaf
as absent costs one redundant open and never a stranded turn.

## TranscriptTurnSection

### setup

```text
from = the previous turn's last step's progressLines.last + 1, or 0
to   = this turn's first step's progressLines.first, or progressLines.length
before = progressLines.slice(from, to)
before empty -> no Setup block
```

```text
the turn spent steps
  prints the lines before its first step
  prints none of the previous turn's lines
the turn spent no steps and produced lines
  prints only its own lines
  leaves the previous turn's command and edit in the previous turn
the turn spent no steps and produced none
  prints no Setup block
the turn is the first of the session
  prints the lines from the start of the session
```

The second case is the defect. The third is what stops the fix printing an empty
heading on a turn that did nothing at all.
