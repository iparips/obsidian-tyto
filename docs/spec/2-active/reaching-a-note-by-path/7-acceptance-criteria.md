---
created: 2026-09-16
updated: 2026-09-16
---

# Acceptance Criteria

The checks that need a real vault: a tab the user moves, an editor holding
unsaved text, and a model deciding what to do about either.

## Setup

- A vault with a todo.md and a shopping-list.md, and a command that opens each
- A configured API key, since every check but the last runs a turn

### An edit lands where the tool opened, whatever the tab does

```gherkin
Given a session on the todo note
When  the user asks for an item to be added to the shopping list
And   the user opens a third note while the turn runs
Then  the item appears in the shopping list
And   neither the todo note nor the third note changes
```

The reported defect, and the reason this spec exists. The item landing in the
third note means the write still follows the tab.

### A read of the note being edited sees unsaved text

```gherkin
Given a turn editing a note
When  the user types a line into that note without saving
And   the model reads the note in the same turn
Then  the read includes the typed line
```

Hard to time by hand: type while the turn is thinking. A read missing the line
means it came from the file.

### A turn names the note it is writing to

```gherkin
Given a session on the todo note
When  the user asks for an item to be added to the shopping list
Then  the turn names the todo note when it starts
And   names the shopping list once the command opens it
And   an earlier turn still names the note it wrote to
```

The last clause is what a header could not do. A turn naming whatever the
session is on now has kept the header's behaviour in a new place.

### A restored session starts a clean turn

```gherkin
Given a session with finished turns
And   Obsidian has been reloaded
When  the user speaks
Then  the new turn holds its own steps
And   the turns above the restored line are unchanged
```

Runs without a key. The stored record changes shape, so this is also the check
that a session written by the old version is discarded rather than half read.

## Platforms

The tab-switching check is worth one pass on mobile, where a note opening behind
a running turn is most likely, and where both reported sessions happened.
