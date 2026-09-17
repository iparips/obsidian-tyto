---
created: 2026-09-17
updated: 2026-09-17
---

# Acceptance Criteria

A docs change has no unit suite behind it, so the checks are a person reading
and a script counting.

### A reader finds the current shape in one file

```gherkin
Given a question about how one subsystem works
When  a reader opens the file for that subsystem
Then  it answers without sending them to a second file for a delta
And   nothing in it describes code that is not in the tree
```

The delta clause is the defect: today four files describe the shipped system
and none is current alone.

### Every inbound link still resolves

```gherkin
Given the thirty references into docs/architecture from specs, AGENTS.md and the README
When  the files are renamed or removed
Then  every one of those references points at a file that exists
```

Scriptable, and worth scripting: sixteen of the thirty point at
7-package-design.md alone.

### No file states a fact the code can contradict

```gherkin
Given a rewritten subsystem file
When  a reader greps the tree for anything it counts or lists
Then  the file names no count, and no list that a new file would falsify
```

The test the size table fails. A doc that lists the contents of a folder is
wrong on the next merge, and nothing tells the reader it has gone wrong.

### The folder is readable at a sitting

```gherkin
Given the rewritten folder
When  a fresh session reads it before starting work
Then  it is under 500 lines in total
And   each subsystem file carries at least one diagram
```

1349 lines today. The number is a proxy for the real check, which is whether a
reader gets to the boundaries without wading through what src already says.
