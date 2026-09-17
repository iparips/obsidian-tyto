---
created: 2026-09-17
updated: 2026-09-17
---

# Acceptance Criteria

The suite cannot judge these. It proves what the writer does once a path and a
body disagree; only a real vault shows whether Obsidian makes them disagree, and
whether the timing the fix assumes is the timing that happens.

## Setup

- A vault with a shopping list a listed command opens, and a long unrelated note
- A configured API key, since every check runs a turn
- The transcript copied after each check, where the mismatch is visible

### The model is shown the note the path names

```gherkin
Given a session on a note other than the shopping list
And   the user opened a long unrelated note earlier in the session
When  the user asks for an item to be added to the shopping list
Then  every note context carries the body of the note its path names
And   the item lands in the shopping list
```

The reported session failed the first Then.

### Unsaved text reaches the model once Obsidian saves

```gherkin
Given a note open with edits typed more than two seconds ago
When  a turn reads that note
Then  the note context carries the typed text
```

D1's accepted cost, bounded. Text typed within the save window reads exactly as
a half-opened view does, so the turn takes the vault and does not see it. Past
the window the file has caught up and the editor is trusted again.

Seen on 2026-09-17: a session where the user typed between turns took the vault
on all six edits and the panel said undo was unavailable on each. Correct, and
the reason the window matters.

### A loaded view still writes through the editor

```gherkin
Given a note open and untouched since it loaded
When  a turn edits it
Then  the edit line says nothing about undo
```

The check that the guard is not simply always failing. Without it, a comparison
that never matches would look like a working fix while costing undo on every
edit.

Passed on desktop, 2026-09-17: the edit line carried no direct-write warning.

### A turn never edits a note it was not pointed at

```gherkin
Given a session that has opened several notes
When  a turn edits its target
Then  no other note in the vault has changed
```

What this spec exists to prevent. The reported session stopped short only
because the model noticed.

## Platforms

One pass on mobile, where OpenedNoteWait's comment says the open race is lost
most often and where the reported sessions happened. Passing on desktop alone
would mean the timing is not the cause.

| Platform | Run        | Result                                  |
| -------- | ---------- | --------------------------------------- |
| Desktop  | 2026-09-17 | Passed, and the probe did not reproduce |
| Mobile   | Not run    | Outstanding                             |
