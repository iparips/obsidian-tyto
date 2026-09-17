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
Given the thirty-four markdown links into docs/architecture from specs and AGENTS.md
When  the files are renamed or removed
Then  every one of those references points at a file that exists
```

Scriptable, and worth scripting: seventeen of the thirty-four point at
7-package-design.md alone, which is what makes its removal the risky one.

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
Then  its prose is under 400 lines, diagrams and tables excluded
And   each subsystem file carries at least one diagram
```

1349 lines today. The number is a proxy for the real check, which is whether a
reader gets to the boundaries without wading through what src already says.

The budget counts prose alone, revised from a 500-line total once the folder
was read. A total penalises the diagrams, which are the content most worth
keeping: seven files carrying seven diagrams and the tables around them spend
roughly 500 lines before a sentence of prose is written. Cutting to a 500-line
total would mean dropping diagrams to make room for prose, which is backwards.
