---
created: 2026-09-16
updated: 2026-09-16
---

# Tests

## Setup

- A vault with at least one markdown note
- A configured API key
- A Tyto session running and bound to a note, so the header names it

### An empty tab unbinds the session

```gherkin
Given a session bound to a note
When  the user opens a tab holding no file
Then  the panel header names no note
```

A header that keeps naming the note means Obsidian is not firing file-open for
an empty tab, which the design records as an assumption. The fix then needs
another event, most likely active-leaf-change.

### An unbound session edits nothing

```gherkin
Given a session unbound by an empty tab
When  the user gives an instruction that names no note
Then  no note is edited
And   the reply says no note is bound
```

### Opening a note binds the session again

```gherkin
Given a session unbound by an empty tab
When  the user opens a markdown note
Then  the panel header names that note
And   an instruction edits it
```

### A canvas unbinds rather than binding

```gherkin
Given a session bound to a note
When  the user opens a canvas
Then  the panel header names no note
```

A canvas that keeps the previous note's name means the extension test is letting
through something no editor can show to the edit tools.

## Platforms

Every check runs on desktop and mobile. The empty tab is easier to produce on
mobile, which is where the bug was found, so check there first.
