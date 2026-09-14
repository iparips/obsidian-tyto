# What the Guard Defends

The comments on the edit guard said it defended against an editor Obsidian
reported but no longer showed. Three probes on Obsidian mobile found no such
state, so the comments were corrected to say what the guard verifiably does.

## What was probed

The developer console, against a live vault on mobile, reading every markdown
leaf the workspace holds.

```javascript
app.workspace.getLeavesOfType('markdown').map((leaf) => ({
  path: leaf.view?.file?.path,
  hasEditor: 'editor' in leaf.view,
  inDom: document.body.contains(leaf.view?.containerEl),
  cmAlive: !!leaf.view?.editor?.cm?.dom?.isConnected,
}))
```

| State                    | Leaves | Verdict                            |
| ------------------------ | ------ | ---------------------------------- |
| Note showing             | 1      | Every field healthy                |
| Navigated away           | 0      | Empty, so a lookup fails correctly |
| Backgrounded and resumed | 1      | Every field healthy                |

No state reports an editor that is not there. A closed note leaves nothing to
find, which is what the resolver already handles.

## What was ruled out

- Deferred views. Obsidian 1.7.2 backgrounds a leaf into a DeferredView carrying
  no editor, which looked like the cause. The probes show isDeferred false while
  a note is open, and a lookup reading the editor off a view already yields null
  where there is none, so the case is handled either way.
- A torn-down CodeMirror behind a surviving view object. cmAlive is true in every
  state the probes reached.

## What the guard actually prevents

An edit landing on the note the turn was already pointing at, after the model
chose a different one and did not open it.

That outcome is correct rather than faulty: consent names a note the model may
open, and until the open runs the turn is still on the note the user has in
front of them. What was missing is that the panel's edit step names no note, so
nothing said where the edit went.

Removing the guard and naming the note is the subject of
[18-editing-what-was-chosen](../18-editing-what-was-chosen/1-index.md).

## What changed here

Three comments, in TurnRepository, NoteEditTool and the test that records the
original report. Each dropped the claim about a reported-but-hidden editor and
states what the guard keeps together instead.

Three other comments mentioning staleness were left alone. They say an editor
handle held across turns goes stale, which the navigated-away probe confirms.
