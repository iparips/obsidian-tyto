---
created: 2026-09-17
updated: 2026-09-17
---

# Acceptance Criteria

The suite cannot judge these. No fake here builds a view that reports a path
while its editor holds another note's text, so a real vault is the only place
the two come apart.

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

### Unsaved text still reaches the model

```gherkin
Given a note open with edits typed in the last second
When  a turn reads that note
Then  the note context carries the typed text
```

The cost of the chosen design if it goes wrong: a comparison that distrusts the
editor too readily falls back to the vault and drops what the user just typed.

### A turn that cannot trust its handle still edits the right note

```gherkin
Given a turn whose target was opened by a command
When  the user switches that tab to another note while the turn runs
Then  the edit appears in the note the command opened
And   the note the user switched to is unchanged
```

The fallback this reuses, so the check is that it still works.

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
