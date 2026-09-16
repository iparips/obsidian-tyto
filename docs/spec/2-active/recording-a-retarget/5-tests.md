---
created: 2026-09-16
updated: 2026-09-16
---

# Tests

## Setup

- A vault with at least two markdown notes
- A configured API key, since the model half cannot be checked without one
- A Tyto session running and bound to one of the notes

### The panel says the note changed

```gherkin
Given a session bound to a note
When  the user opens the other note
Then  a step in the panel says the session retargeted
And   the step names the note now in front of the user
```

### An unbound session says so

```gherkin
Given a session bound to a note
When  the user opens a tab holding no file
Then  the step says no note bound rather than naming a path
```

Reachable only once binding-to-the-active-tab lands, since that is what produces
an unbound session.

### The transcript records the change

```gherkin
Given a turn has finished on the bound note
And   the user has opened the other note and finished a second turn
When  the user copies the transcript from the panel header
Then  the transcript names the retarget between the two turns
```

A retarget missing entirely is the between-turns case, which the design records
as the one the history carries rather than a step.

### The model does not reach back

```gherkin
Given a turn has edited the bound note
And   the user has opened the other note
When  the user gives an instruction that names no note
Then  the edit lands on the note now in front of the user
```

An edit landing on the first note means the retarget message is reading as a
directive rather than as history, which is the failure archived spec 29 found.
Drop the message and keep the panel step.

## Platforms

The last check is a prompt change and cannot be judged from the code, so it
needs a real vault and a real key. The rest run anywhere.
