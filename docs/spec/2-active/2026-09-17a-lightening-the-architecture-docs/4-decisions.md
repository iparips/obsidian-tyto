---
created: 2026-09-17
updated: 2026-09-17
---

# Decisions

## Requirements

### Decisions

#### D1: What are the subsystems? [resolved 2026-09-17]

Seven files, grouping the thin packages. Ilya chose it.

A file per subsystem needs the list agreed, since it is the folder's whole
structure. The packages in src are the obvious candidate, but eleven files is
more than a reader wants and some packages are one class.

| Option                        | Files | Cost                                      |
| ----------------------------- | ----- | ----------------------------------------- |
| Seven, grouping thin packages | 7     | Two groupings are a judgement, not a path |
| One per package               | 11    | recorder and shared are one class each    |
| Four, by layer                | 4     | A layer is not where a reader looks       |

The seven-file shape, with the packages each would cover:

| File               | Covers                                              |
| ------------------ | --------------------------------------------------- |
| 1-overview         | Every package, and the dependency direction         |
| 2-vocabulary       | No package; the words the others use                |
| 3-capture          | recorder, model/providers                           |
| 4-the-turn         | engine, minus the note folders                      |
| 5-asking-the-model | model, minus providers                              |
| 6-reaching-a-note  | search, commands, engine/note-binding, note-editing |
| 7-the-panel        | session, settings                                   |

Two groupings are a judgement rather than a path, and both are worth stating.
Capture pairs recorder with model/providers, since a transcription provider is
capture rather than a model call. Reaching a note pairs search and commands with
the engine's two note folders, since finding a note and writing to it is one
question a reader asks.

#### D2: What happens to the release files? [resolved 2026-09-17]

All six go, and the shipped content folds into the subsystem files. Ilya chose
it.

Files 1 to 6 describe releases. Four shipped and are one system; two are
unbuilt and already specified in 1-upcoming.

| Option                                  | Cost                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| Delete all six, fold shipped content in | Loses the record of what each release added              |
| Keep them, add subsystem files beside   | Two descriptions of one system, which is today's problem |
| Delete 5 and 6, fold 1 to 4 in          | Same loss as the first, for the shipped four             |

What the loss actually is: docs/plan/1-index.md already says what each release
added, and each has a spec in 3-archived holding its requirements and design.
The architecture file is a third copy.

So this is a rewrite rather than an addition. Nothing is lost that is not
recorded twice already: docs/plan/1-index.md says what each release added, and
each shipped release has a spec in 3-archived holding its requirements and
design.

#### D3: What happens to the size table? [resolved 2026-09-17]

Dropped, and the limit stays. Ilya chose it.

7-package-design.md carries a per-folder file count, and three of four sampled
rows are already wrong.

| Option                        | Cost                                        |
| ----------------------------- | ------------------------------------------- |
| Drop it, keep the limit       | No record of which folder is near the limit |
| Keep it, correct it now       | Wrong again by the next merge               |
| Replace it with a build check | A new check to write and maintain           |

The limit is a rule, so it belongs in a doc. The counts are a snapshot, so they
do not: nobody re-runs them, and three of four were already wrong. A reader who
wants a count runs ls, which cannot go stale.

### Assumptions

- The four shipped releases describe one system with no contradictions between
  them. They were written as deltas, so a later file supersedes an earlier one
  where they disagree; if two turn out to disagree without saying so, the
  subsystem file states what the code does and the spec says which was wrong.
- Diagrams carry the weight the prose currently does. Six exist across five
  files; the rewrite keeps them and drops the prose around them. If a boundary
  turns out to need prose a diagram cannot hold, that file runs longer.

## Design

Written when the design is.
