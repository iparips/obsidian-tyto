---
created: 2026-09-16
updated: 2026-09-16
---

# Acceptance Criteria

Most of this spec is unit-reachable. What is left needs a real model deciding
which tool to reach for, which no double can judge, and a real vault to move
notes in.

## Setup

- A vault with a todo.md holding several ticked items under different headings
- A configured API key, since every check but the first needs a real model
- A second note open in another tab, to move to

### A turn finishes the note it started on

```gherkin
Given a turn is archiving the todo list
When  the user opens a different note while it runs
Then  the archive completes in the todo file
And   the panel header names the note the user opened
And   the next turn edits the note the user opened
```

The defect this spec opened on. An edit landing in the second note means the
running turn is still being retargeted.

### An archive is one write, not a batch

```gherkin
Given a todo file with ticked items under several headings
When  the user asks for done items to be archived
Then  the panel shows one edit rather than one per heading
And   the file holds each archived item once
```

Judgement rather than assertion: the unit suite can check the boundary refuses a
second edit, not that the model reaches for the whole-note write instead of
retrying anchors. Duplicated items mean it is still batching.

### A stale whole-note write is refused

```gherkin
Given the model has read the note and is about to write it
When  the user edits that note by hand before the write lands
Then  the write is refused, saying the note moved
And   the user is not asked to confirm a write that was refused
```

The guard that makes the tool safe to offer. Hard to time by hand: type into the
note while a turn is thinking. A write that lands over the typing means the
staleness check is not reached.

### The user confirms a whole-note write

```gherkin
Given a whole-note write has passed both refusals
When  the confirmation is offered
Then  declining leaves the note untouched
And   accepting replaces it, and one undo takes it back
```

The undo half is worth checking once: every edit goes through the editor rather
than the vault, so the stack should hold the write as a single entry.

## Platforms

The first check runs anywhere. The rest need a real key. Worth one pass on
mobile, where a note opening behind a running turn is most likely, since that is
how the reported session happened.
