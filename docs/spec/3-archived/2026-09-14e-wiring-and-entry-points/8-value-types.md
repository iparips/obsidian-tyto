---
created: 2026-09-14
updated: 2026-09-14
---

# Commit 4: Misplaced Repositories

Commit 4 of [5-tasks.md](5-tasks.md). It moves two files, and it deliberately
moves nothing else.

## Why the value types stay put

A value read by more than one package belongs to neither, so it moves to a
package beside them. Six types here meet that count: allowed-obsidian-command
(commands, engine, model, settings), note-opened-by-obsidian-command and
obsidian-command-match, and grep-request, grep-result and result-order (engine,
search).

They still stay inside search/models and commands/models, because the rule
exists to break cycles and there is no cycle here. Engine and settings read
these types; neither folder reads back. The dependency already points one way,
so lifting them out would buy a package boundary and nothing behind it.

Two further costs settle it. Neither search nor commands gains an entry point in
this spec, since neither has a single owning service, so no interior is closing
that would shut engine out. And the leftover folders would be small: search/models
at 3 files and commands/models at 1.

Revisit when search or commands gains an entry point, or when a value here turns
up in a cycle. [6-cycles.md](6-cycles.md) has the two that exist.

## Repositories do not belong in a models folder

A models folder holds values. A repository holds state that accumulates and
methods that change it, so it sits beside the services that use it however small
it is. The test is a mutable collection surviving across calls, not the presence
of methods: a value object may answer questions about itself.

Two classes fail it today, and both move in this commit.

paths-returned-by-vault-repository sits in search/models but search never reads
it: all three readers are in engine. It holds a Set that accumulates across a
session. It moves to engine/turn, beside notes-chosen-by-user-repository, which
its own comment already compares it to. turn/ goes 8 to 9, inside the limit.

loaded-skills sits in session/transcript/models and holds a Map of skill bodies
gathered as the document walks the turn steps. All four readers are in
transcript, so it moves up one level to session/transcript beside them.
transcript/ goes 8 to 9, its models folder 5 to 4.

Moving the first makes search-hit cross a boundary, since the repository imports
it. That is a reader count changing, not a cycle, so search-hit stays in
search/models either way. Note what you find.

## Where the counts land

| Folder                    | Before | After |
| ------------------------- | ------ | ----- |
| search/models             | 7      | 6     |
| engine/turn               | 8      | 9     |
| session/transcript        | 8      | 9     |
| session/transcript/models | 5      | 4     |

Every folder stays inside the ten-file limit. commands/models does not change.
