---
created: 2026-09-17
updated: 2026-09-17
---

# Design: Lightening The Architecture Docs

Thirteen release-shaped files become seven subsystem-shaped ones. This file
says where each existing file's content lands, and what is dropped rather than
moved.

The size budget changed while this was written. 5-acceptance-criteria.md now
caps prose at 400 lines rather than the folder at 500, because seven diagrams
and their tables spend most of a 500-line total before any prose, and the
diagrams are the part worth keeping.

## Table of Contents

1. [What Decides A Sentence Survives](#what-decides-a-sentence-survives)
2. [Where Each File Lands](#where-each-file-lands)
3. [The Seven Files](#the-seven-files)
4. [The Diagrams](#the-diagrams)
5. [What Is Dropped](#what-is-dropped)
6. [Links In And Out](#links-in-and-out)
7. [Out Of Scope](#out-of-scope)
8. [References](#references)

## What Decides A Sentence Survives

One test, applied to every sentence of the 1349: does a reader with src open
still need it. Three kinds pass.

- Why something sits where it does. TurnRepository holds the note because an
  editor handle cannot outlive its turn. That reasoning is in no file.
- What is deliberately absent, and why. The transcript is kept out of the
  stored record, and no cross-file tool exists.
- Which rule is positional. Only src/wiring may construct across packages;
  nothing outside a views folder imports React.

Three kinds fail, and are dropped wherever they appear.

- A count or a listing src answers faster: the size table, file counts, and the
  lists of what a folder holds.
- A restatement of a signature or a class name a grep finds.
- Requirement IDs. FR14 identifies nothing to a reader of the code, and the
  spec that defines it is archived beside it.

The cross-cutting files (8 to 12) already pass this test, which is why they
carry most of what survives. The release files mostly fail it.

## Where Each File Lands

| Today                         | Lines | Lands in                      | What survives                                  |
| ----------------------------- | ----- | ----------------------------- | ---------------------------------------------- |
| 0-index                       | 31    | 1-overview                    | The reading order, rewritten for seven files   |
| 2026-08-28a-desktop-mvp                 | 205   | 3-capture, 6-reaching-a-note  | The service and value rule, anchor uniqueness  |
| 2026-08-28b-mobile-mvp                  | 52    | 3-capture                     | The container differs by platform, and why     |
| 2026-09-02-agents-md-loading           | 75    | 5-asking-the-model            | Write target picks the chain, nearest wins     |
| 4-obsidian-agent-harness      | 39    | 6-reaching-a-note             | The model never chooses a write path           |
| 5-desktop-v1                  | 68    | nothing                       | Unbuilt; it lives in 1-upcoming                |
| 6-mobile-v1                   | 49    | nothing                       | Unbuilt; it lives in 1-upcoming                |
| 7-package-design              | 231   | 1-overview, and rules to each | The dependency rule, the cycles, the layout    |
| 8-parking-a-turn              | 117   | 4-the-turn                    | Nearly all of it, condensed                    |
| 9-an-utterance-and-its-answer | 79    | 4-the-turn                    | Why the engine returns rather than publishes   |
| 10-asking-the-model           | 120   | 5-asking-the-model            | Nearly all of it, condensed                    |
| 11-the-two-records            | 161   | 7-the-panel                   | The two lists, where they meet, what is absent |
| 12-the-panel-vocabulary       | 122   | 2-vocabulary                  | All of it, near unchanged                      |

Two files land nowhere. Releases 5 and 6 are unbuilt, and each has a fuller
spec in 1-upcoming, so their content is deleted rather than moved.

7-package-design splits rather than moves. Its package table and dependency
diagram are the whole of 1-overview; its layout rules go to the file each
governs, since a rule about engine's folders is read by someone reading about
the turn.

## The Seven Files

Each holds one diagram and the boundaries around it. D1 fixed the packages each
covers.

### 1-overview

The package table, the dependency rule, the two open cycles, and the
construction rule. The dependency flowchart from 7-package-design, redrawn with
the four packages it omits (agents, commands, search, skills as a supplier of
engine) so it matches the table beside it.

Also the folder's index: what each of the other six covers. The old note that
numbers are permanent goes, since this change renumbers everything.

### 2-vocabulary

12-the-panel-vocabulary, near unchanged. It is already the shape the other six
are being cut to: tables of one concept per row, and the three-level nesting
that made turn and progress line easy to confuse.

Two edits only. The title loses "panel", since the words are the codebase's
rather than the panel's. Its references are repointed at the new filenames.

### 3-capture

Recorder and model/providers. The shortest of the seven.

What survives: one utterance per start-stop cycle, the container differing by
platform and why no transcoding happens, and the skills folder being a normal
vault folder because Obsidian Sync copies no dot-folder to a phone. That last
is a real constraint with a non-obvious cause, and it is in no other file.

Diagram: the capture decision flowchart from 2026-08-28b-mobile-mvp, redrawn.

### 4-the-turn

Engine minus the note folders: the loop, the step budget, the five endings,
cancellation, and parking.

Takes both diagrams from 8-parking-a-turn (the choice and the cancel) and the
outcome table from 9-an-utterance-and-its-answer. Parking is the largest thing
here, because a turn waiting on a person who may never answer is machinery the
rest of the codebase does not have.

Also from 9: why the ending returns rather than publishing, which is the one
asymmetry in how the panel hears from the engine.

Engine's folder layout table moves here from 7-package-design.

### 5-asking-the-model

Model minus providers: prompt assembly, message order, and where skills and
AGENTS.md enter.

10-asking-the-model condensed, keeping its sequence diagram, plus the two
boundaries from 2026-09-02-agents-md-loading that are not requirement restatements: the
write target picks the chain, and nearest-last is the override mechanism.

Message order is the load-bearing part. The date and the note sit after the
history because the history holds a stale copy of each; VaultInstructions stays
inside the system prompt because its fencing rules only hold above the quote.

Model's folder layout is dropped rather than moved: PromptFactory being the
package's entry point is the only part a reader cannot see from the tree, and
that is stated in the lead.

### 6-reaching-a-note

Search, commands, engine/note-binding and engine/note-editing: finding a note
and writing to it.

From 4-obsidian-agent-harness: the model never chooses a write path,
destinations come from commands, and the allow-list is the user's. From
2026-08-28a-desktop-mvp: anchor uniqueness, and offsets recomputed after each operation.
From 2026-08-28a-desktop-mvp's skill scope section: the tool list is the real boundary,
so a skill reaching for a cross-file tool finds nothing to call. Restated
against the tools that now exist, since write_note and open_note postdate that
file and neither widens the bound.

Diagram: a new flowchart, the one place a diagram is invented rather than
redrawn. The six existing ones have no picture of how an utterance reaches a
note, because that path was assembled across four release files.

### 7-the-panel

Session and settings. 11-the-two-records, condensed, keeping its sequence
diagram.

The two lists, what triggers each write, the two facts in both, and what is in
neither. The stored record and the transcript's deliberate absence from it.

Wiring's three scopes move here, since the panel is what they build, along with
the note that PluginScope reads settings through a function.

## The Diagrams

Six exist and all six are kept, redrawn against current class names. One is
added.

| Diagram                     | From               | Goes to            | Change                        |
| --------------------------- | ------------------ | ------------------ | ----------------------------- |
| Package dependencies        | 7-package-design   | 1-overview         | Add the four missing packages |
| Capture by platform         | 2026-08-28b-mobile-mvp       | 3-capture          | Redrawn as-is                 |
| One choice, to settled      | 8-parking-a-turn   | 4-the-turn         | Redrawn as-is                 |
| The same turn, cancelled    | 8-parking-a-turn   | 4-the-turn         | Redrawn as-is                 |
| One ask, end to end         | 10-asking          | 5-asking-the-model | Redrawn as-is                 |
| Both lists through one turn | 11-the-two-records | 7-the-panel        | Redrawn as-is                 |
| Utterance to note           | new                | 6-reaching-a-note  | Invented                      |

Dropped: the four diagrams in 2026-08-28a-desktop-mvp, 5-desktop-v1 and 6-mobile-v1. The
MVP module map and utterance flow name SessionView, AgentSession and an
EditEngine that runs the loop, none of which the code still has. The two V1
diagrams describe unbuilt code.

## What Is Dropped

- The size table and its per-folder counts. D3. The limit of 10 stays, in
  1-overview.
- Every requirement ID. The archived specs hold them.
- Every "delta design on top of" line, and the release framing with it.
- The per-release risk and out-of-scope sections. A risk checked by a shipped
  release is no longer a risk.
- The MVP's provider interface listing and edit tool table: TOOL_SCHEMAS and the
  provider files say both, and the doc goes stale when a tool is added.
- Release 5 and 6 content entirely.

## Links In And Out

Thirty-four markdown links point into the folder and every one must still
resolve. Seventeen name 7-package-design, which no longer exists.

Inbound links are repointed at the file that took the content:

| Old target                 | New target                             |
| -------------------------- | -------------------------------------- |
| 7-package-design.md        | 1-overview.md                          |
| 12-the-panel-vocabulary.md | 2-vocabulary.md                        |
| 0-index.md                 | 1-overview.md                          |
| 2026-08-28a-desktop-mvp.md           | 1-overview.md                          |
| 8, 9                       | 4-the-turn.md                          |
| 10, 2026-09-02-agents-md-loading    | 5-asking-the-model.md                  |
| 4-obsidian-agent-harness   | 6-reaching-a-note.md                   |
| 11-the-two-records.md      | 7-the-panel.md                         |
| 2026-08-28b-mobile-mvp.md            | 3-capture.md                           |
| 5, 6                       | the matching spec folder in 1-upcoming |

An archived spec keeps its prose. Only the link target changes, because a
reference to a file that does not exist is a broken link whatever it says.

The numbers restart at 1, against the old index's rule that numbers are
permanent. That rule protected citations, and repointing all thirty-four is
what pays for breaking it. Renumbering is the point: a reader should not open
the folder and find it starts at 7.

AGENTS.md's Package Layout section points at 7-package-design for the package
layout. It is repointed at 1-overview, and its sentence is rewritten, since the
layout rules now sit in the file each governs.

## Out Of Scope

- docs/plan. Release-shaped writing belongs there and is not touched.
- The archived and upcoming spec folders, beyond repointing their links.
- Any code change. No source file moves, and no test changes.

## References

- [3-requirements.md](3-requirements.md) - the delta chain and the drifting prose
- [4-decisions.md](4-decisions.md) - D1 fixes the seven files, D2 the deletions, D3 the size table
- [5-acceptance-criteria.md](5-acceptance-criteria.md) - the four checks, one scripted
- docs/architecture/12-the-panel-vocabulary.md - the model for the other six
- docs/plan/1-index.md - what each release added, which is why the release files need not say it
