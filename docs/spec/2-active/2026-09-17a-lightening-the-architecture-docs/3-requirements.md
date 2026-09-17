---
created: 2026-09-17
updated: 2026-09-17
---

# Lightening The Architecture Docs

## Motivation

The architecture folder holds 1349 lines across 13 files. Six of them describe
releases rather than subsystems, two of those six describe releases that have
not shipped, and the four that have shipped are written as a chain of deltas.

A reader who wants to know how something works now has to read four files and
replay the diffs between them. That is the opposite of what an architecture doc
is for.

## In Scope

### The releases are a delta chain, so no file says what is true now

Files 1 to 6 each build on the one before: release 2 is "a delta design on top
of release 1", 3 on top of 2, 4 on top of 3. The arrangement made sense while
the releases were being built in order, one at a time.

It does not survive them shipping. Releases 1 to 4 are shipped and are one
system, described in four places, none of which is current on its own.

### Two files describe work that does not exist

Releases 5 and 6 are unbuilt. Both already have a spec in 1-upcoming, each
fuller than the architecture file:
[2026-09-14b-desktop-v1](../../1-upcoming/2026-09-14b-desktop-v1/1-index.md)
and [2026-09-14c-mobile-v1](../../1-upcoming/2026-09-14c-mobile-v1/1-index.md).

Unbuilt work has a home, and it is 1-upcoming. An architecture doc that
describes it says the code is one shape when it is another.

### The prose restates what the code says, and drifts from it

The five cross-cutting files carry six diagrams between them and roughly 700
lines of prose. Much of that prose is detail a reader would get faster from
src, and being a second copy it goes stale.

The size table in 7-package-design.md is the clearest case. Three of its four
sampled counts are wrong, and its closing claim is now false:

| Folder              | Table says | Actually |
| ------------------- | ---------- | -------- |
| engine/tools        | 10         | 10       |
| session/models      | 8          | 10       |
| session/views       | 10         | 12       |
| engine/note-editing | 5          | 7        |
| session root        | 10         | 11       |
| engine/turn         | 9          | 10       |

The table closes with "every folder is within the limit", against a limit of 10.
Two folders are over it: session/views at 12 and the session root at 11.
A third, engine/turn, has reached it.

## Out Of Scope

- The plan folder. docs/plan holds the releases and the sittings, which is
  where release-shaped writing belongs and is not what this changes.
- The spec folders. A shipped spec records what was decided at the time and is
  not rewritten to match the code.

## References

### Task

- [docs/architecture/1-overview.md](../../../architecture/1-overview.md) - open first: the 13 files, and which are cross-cutting
- [docs/architecture/1-overview.md](../../../architecture/1-overview.md) - the most-cited file, holding the package table, the layout rules, the stale size table and one open question
- [docs/architecture/2-vocabulary.md](../../../architecture/2-vocabulary.md) - the newest file, already subsystem-shaped rather than release-shaped
- [docs/architecture/1-overview.md](../../../architecture/1-overview.md) - the head of the delta chain, and the only one of the six that is not a delta

### Project

- [docs/plan/releases.md](../../../plan/releases.md) - the seven releases, and which have shipped
- [AGENTS.md](../../../../AGENTS.md) - points at the architecture docs, and defers package layout to them
