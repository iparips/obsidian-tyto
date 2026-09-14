---
created: 2026-09-14
updated: 2026-09-14
---

# Requirements

Every folder holds ten files or fewer. Nothing about what the plugin does
changes.

## What is over today

Counted as source files in the folder itself, excluding its tests folder, which
the architecture doc exempts.

| Folder        | Files | Over by |
| ------------- | ----- | ------- |
| session/views | 17    | 7       |
| engine/tools  | 16    | 6       |
| engine/turn   | 14    | 4       |
| session       | 10    | 0       |

session sits exactly on the limit, so it is listed to be watched rather than
split. The next file added to it puts it over.

## What decides the shape of a split

The code-generation skill's three stages. A folder holding two concepts splits
by concept; one holding a single concept that has simply grown splits by kind.
The test is what imports each file: a cluster nothing outside it imports is a
concept waiting to be named.

Applied here, three of the four are concept splits and one is a kind split.

## What may not change

- Behaviour. Every test passes before and after, unchanged except for import
  paths.
- Public names. A class keeps its name; only the file it lives in moves.
- The dependency direction in
  [architecture/7-package-design.md](../../../architecture/7-package-design.md).
  No new folder may import from a package above it.
- The release 3 prompt fixture, which no file here touches.

## Test Scenarios

### Every folder is within the limit

```gherkin
When  the source files in each folder are counted, excluding its tests folder
Then  no folder holds more than ten
```

### The suite is unchanged

```gherkin
Given the split has landed
When  the unit suite runs
Then  every test passes
And   no test changed except its import paths
```

### The architecture doc matches the tree

```gherkin
When  the size table in 7-package-design.md is read
Then  every count matches the folder it names
And   no folder is listed as over the limit
```

## Questions

- Whether session, at exactly ten, should be split now rather than watched. The
  position taken is to watch it: splitting a folder that is not yet over invents
  a boundary rather than finding one.
- Whether test folders should be counted. The architecture doc exempts them and
  this spec does not revisit that.

## References

### Task

- [src/session/views](../../../../src/session/views) - open first; the largest, and the only kind split
- [src/engine/tools](../../../../src/engine/tools) - two concepts under one name
- [src/engine/turn](../../../../src/engine/turn) - the loop, and what a turn spends

### Project

- [architecture/7-package-design.md](../../../architecture/7-package-design.md) - what each package owns, the dependency rule, and the size table this updates
