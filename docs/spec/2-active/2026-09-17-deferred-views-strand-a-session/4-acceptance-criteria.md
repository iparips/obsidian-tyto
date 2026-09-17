---
created: 2026-09-17
updated: 2026-09-17
---

# Acceptance Criteria

Every check here needs a real workspace. A deferred view is Obsidian deciding a
leaf is in the background, which no test double produces.

## Setup

- Obsidian 1.13.0 or later, which the manifest now requires. Views have been
  deferred since 1.7.2
- A vault with a daily-note command and at least two notes
- A configured API key, since the checks run real turns
- The panel open beside a note, not in the same tab group as it

### A backgrounded note takes the next utterance, with undo intact

```gherkin
Given a session whose last turn wrote to a note
When  that note's tab falls into the background
And   the user says something else
Then  the edit lands in the note
And   the panel does not mark the write direct, so undo still works
But   the panel never says the note is not open in an editor
```

The reported path, and it fails today. Reach the note both ways, since only the
second is what was reported: background the tab directly, and run a command that
opens a second note which then backgrounds. The command's own turn already
writes correctly; the turn after it is the one refused.

Runs on desktop and on a phone. Backgrounding is a tab switch on desktop and
leaving the app on a phone. A failure on the phone alone means the load fires
but the editor mounts after it, so the wait is the thing that is wrong.

### A closed tab is written through the vault

```gherkin
Given a session whose last turn wrote to a note
When  the user closes that note's tab
And   says something that edits it
Then  the edit lands in the file
And   the panel marks it written directly, undo not available
But   the note is not reopened and the view does not change
```

The user closed the tab, so nothing brings it back. A pass means they are still
looking at whatever they chose.

### A note that no longer exists says so in words

```gherkin
Given a session whose last turn wrote to a note
When  the note is deleted outside Obsidian
And   the user says something that edits it
Then  the model says it could not find that note
And   no other note is edited
```

The turn opens either way, so the model has to end this one by saying what it
could not do. Silence, or an edit to the nearest match, both fail.

### Only the note in front scrolls when the turn ends

```gherkin
Given a note the user is looking at
When  the user speaks an edit and the turn ends
Then  the note scrolls to show the edit
```

```gherkin
Given a note open behind the panel with the panel in front
When  the user speaks an edit and the turn ends
Then  the note is not scrolled and its cursor does not move
```

Both halves matter: the first is the affordance being kept, the second is the
jerk being removed. On mobile the panel always holds the screen, so only the
second can happen there. On desktop, run the second by putting another tab in
front of the note.

### Loading a deferred leaf does not reopen the workspace

```gherkin
Given a vault with several notes open in background tabs
When  a turn resolves one of them
Then  only that note's tab loads
And   the other background tabs stay deferred
```

Judgement rather than an assertion: read it off Obsidian's own tab rendering.
Every tab loading means the fix swept the workspace instead of narrowing to the
target.

### A turn with no steps reports its own setup

```gherkin
Given a conversation whose second turn ended without a model call
When  the transcript is copied
Then  that turn's Setup block names only its own work
And   the previous turn's command and edit stay in the previous turn
```

No turn is refused for an unresolvable note any more, so reach this by cancelling
a turn before its first model call.
