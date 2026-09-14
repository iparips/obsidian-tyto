# Requirements: Commands, Rebinding and Search

Numbered requirements for the [Obsidian Agent Harness](02-requirements.md).
Grouped by the two flows, which share only the agent loop.

## Command catalogue

FR1. Enumerate the commands Obsidian currently offers, with id and display
name.

FR2. Filter the enumerated list to an allow-list before it reaches the model,
so the catalogue is a chosen surface rather than everything installed.

FR3. Let the user edit the allow-list in settings, as a list of entries that
are each either one command id or a pattern.

FR4. Match a pattern against command ids, where the plugin id before the colon
is literal and a trailing wildcard may follow it. Reject any pattern without a
colon, and any with a wildcard in the plugin id. An exact id needs no colon:
Obsidian's core commands are registered unnamespaced, as daily-notes, and an
exact id matches one command so it cannot reach across plugins.

FR5. Default the allow-list to commands that open or create a note, and to no
others.

FR6. Re-evaluate patterns against the live command list every session, so a
command registered after the pattern was written is matched without the user
editing settings.

FR7. Show the user which commands an allow-list currently resolves to, so a
pattern's reach is visible rather than inferred.

FR8. Keep the settings list usable on a phone: the resolved command list is
collapsed by default, and the editable entries stay few enough to scroll.

FR9. Inject the allowed commands into the system prompt as id and name pairs,
the same shape as the skill catalogue.

FR10. Exclude a command from the catalogue when Obsidian reports it as
unavailable in the current context.

FR11. Instruct the model, in the command section of the prompt, to decline a
command whose effect it cannot determine from the name, and to say which
command it declined and why.

## Running a command

FR12. Give the model a tool that runs one allowed command by id.

FR13. Refuse a command id absent from the allow-list, and tell the model why,
rather than failing the turn.

FR14. Report back to the model what changed after a command ran: the active note
path, or that nothing opened.

FR15. Cap the number of commands one turn may run.

FR16. Record every command run in the panel history, named, before any edit
that follows it.

## Session rebinding

FR17. Rebind the session to the note a command opened, so subsequent edit tools
target it.

FR18. Leave the binding unchanged when a command opens no note.

FR19. Show the current binding in the panel, and show it changing.

FR20. Let the user return the session to the note it started on.

FR21. Resolve the rebound note's AGENTS.md chain before writing to it, per
release 3.

## Searching the vault

Superseded by [10-finding-notes](../10-finding-notes/1-index.md). The one fuzzy
search FR22 and FR25 describe is retired, replaced by a glob over paths and a
grep over content. FR23, FR24 and FR26 still hold, against the two new tools.

FR22. Give the model a tool that searches note content and returns matching
paths with surrounding excerpts. Now grep_notes, matching a regular expression
exactly rather than scoring relevance.

FR23. Bound the result set, by match count and by excerpt length, so one search
cannot fill the context window.

FR24. Give the model a tool that reads one named note in full, without binding
the session to it.

FR25. Narrow a query by modification time, so "recently" changes the result set
rather than being ignored. Retired: both new tools sort by modification time
instead, so "recently" orders the results rather than filtering them.

FR26. Cap the number of searches and reads one turn may perform.

## Answering from a search

FR27. Render a search-derived answer as its own panel entry, copyable, rather
than writing it into a note.

FR28. Name in that entry every note path the answer drew on.

FR29. Distinguish the answer entry from an edit entry in the panel, so a turn
that wrote nothing is not mistaken for one that did.

FR30. State plainly when a search found nothing, rather than answering from the
model's own knowledge.

## Flow separation

FR31. Never write a search result into a note, and never open a note the search
found. The search flow terminates at the panel.

FR32. Prefer a command over a search when the utterance names a destination and
an allowed command matches it.

FR33. Say that no command matched, rather than searching for a destination,
when an utterance names one the allow-list cannot reach.

## Non-functional requirements

NFR1. The model can only run commands from the allow-list. No prompt content,
skill, or AGENTS.md file can widen it.

NFR2. Commands run only through Obsidian's own execution path, never by calling
a plugin's internals.

NFR3. The FR11 instruction is a second layer, not the mechanism. The allow-list
is what makes a command unreachable; the instruction only narrows what the model
does with a list wider than the user intended.

NFR4. Command enumeration uses undocumented Obsidian API surface, so its
absence degrades to a harness with no command tool rather than a broken plugin.

NFR5. A turn's writes stay undoable through native Obsidian undo.

NFR6. Search cost stays bounded per turn regardless of vault size.

NFR7. Note content leaving the vault stays limited to what the turn needs: the
bound note, plus excerpts and notes a search returned.

NFR8. A vault where the user allows no commands behaves exactly as release 3,
with search still available.
