---
created: 2026-09-16
updated: 2026-09-16
---

# Tests

## Setup

- A vault with at least two markdown notes
- A configured API key, since the model half cannot be checked without one
- A Tyto session running and bound to one of the notes

The panel checks below say step, which is what this spec built. A retarget is
its own panel entry since D1 of
[reporting-what-a-turn-did](../reporting-what-a-turn-did/1-index.md), so read
them as a line on the timeline rather than a numbered step inside a turn.

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

A retarget missing entirely is the between-turns case. It is carried by the
entry now, not by a history message, and the transcript renders it from there.

### The model does not reach back

```gherkin
Given a turn has edited the bound note
And   the user has opened the other note
When  the user gives an instruction that names no note
Then  the edit lands on the note now in front of the user
```

The message this check was written for is gone, dropped by D1 of
[reporting-what-a-turn-did](../reporting-what-a-turn-did/1-index.md). The check
itself still matters and moved there: it now asks whether NoteContextMessage
alone keeps the edit on the note in front of the user. An edit landing on the
first note means the message was carrying something, and that spec's D1 falls
back to an option keeping it.

## Platforms

The last check is a prompt change and cannot be judged from the code, so it
needs a real vault and a real key. The rest run anywhere.
