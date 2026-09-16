---
created: 2026-09-16
updated: 2026-09-16
---

# Acceptance Criteria

Most of this spec is unit-reachable: all three defects were reproduced by a
temporary test before being written up, and the unknown-name refusal is a
dispatcher check a test can call directly. What is left here needs a real
provider or a real restore, which a double cannot judge.

## Setup

- A vault with at least two markdown notes, one of them a todo.md
- A configured API key: every check but the restore one sends a real request
- A command in the allow-list that opens the second note

### A command that opens a note completes its turn

```gherkin
Given a session bound to a note
When  the user asks for something that makes the model run a command opening the other note
Then  the turn finishes and the panel shows the command and what followed it
```

A 400 saying `Unexpected role 'tool' after role 'system'` means the retarget is
still landing between the tool call and its result.

### The model is told which call applied the edit

```gherkin
Given a session bound to a todo.md holding at least one item
When  the user speaks an instruction that adds an item
Then  the reply names what was added rather than saying it was already there
```

A reply claiming the edit was already applied means the tool result still reads
as an earlier edit. Judgement, not an assertion: the unit suite can check the
string, not what the model makes of it.

### A retarget after a restore lands after the restore

```gherkin
Given a session with at least one finished turn
And   Obsidian has been reloaded so the session is restored
When  the user opens a different note before speaking
Then  the retarget appears after the restored line, not inside the turn above it
```

Runs without a key. The restore is the part a unit test cannot arrange, since it
needs the panel to mount from a stored record.

### The model edits the note in front of the user

```gherkin
Given a turn has edited the bound note
And   the user has opened a different note without speaking
When  the user gives an instruction that names no note
Then  the edit lands on the note now in front of them
```

The check that the dropped history message was carrying nothing
NoteContextMessage does not already carry. An edit landing on the first note
means the message earned its place, and D1 falls back to an option that keeps
it.

## Platforms

Every check but the restore one sends a real request and needs a key. The
restore check runs on desktop and mobile, and the mobile run is the one worth
doing: mobile is where a session is backgrounded and restored most often.
