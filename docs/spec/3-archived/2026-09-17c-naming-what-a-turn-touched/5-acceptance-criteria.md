---
created: 2026-09-17
updated: 2026-09-17
---

# Acceptance Criteria

The checks that need a real vault: a tab the user moves, a model choosing which
note to read, and a panel read rather than a test asserted.

## Setup

- A vault with a todo.md and a shopping-list.md, and a command that opens each
- A configured API key, since every check runs a turn

### A turn that passes through notes says nothing about it

```gherkin
Given a session on the todo note
When  the user asks for an item to be added to the shopping list
Then  the turn names the shopping list once the command opens it
And   no line says the session is now editing any note
```

The reported session ended with three such lines. None of them said anything
the turn's own target does not.

### A line naming another note stands out

```gherkin
Given a turn whose target is the shopping list
When  the model reads the todo note in that turn
Then  that line names the todo note
And   the lines acting on the shopping list name no note
```

The point of the rule: one line differs, and it is the one the reader needs.

### A user who cannot undo is told

```gherkin
Given a turn editing a note the user has open
When  the user switches that tab to another note while the turn runs
Then  the edit appears in the note the tool opened
And   the panel says that write did not go through the editor
```

Blocked on D3 for what the line says. The check itself holds either way: the
user learns the write took the other path.

## Platforms

Worth one pass on mobile, where a note opening behind a running turn is most
likely and where the reported sessions happened.
