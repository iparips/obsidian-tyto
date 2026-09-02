# Requirements: Commands, Rebinding and Search

Numbered requirements for the [Obsidian Agent Harness](1-requirements.md).
Grouped by the two flows, which share only the agent loop.

## Command catalogue

FR1. Enumerate the commands Obsidian currently offers, with id and display
name.

FR2. Filter the enumerated list to an allow-list before it reaches the model,
so the catalogue is a chosen surface rather than everything installed.

FR3. Let the user edit the allow-list in settings, with a safe default set.

FR4. Inject the allowed commands into the system prompt as id and name pairs,
the same shape as the skill catalogue.

FR5. Exclude a command from the catalogue when Obsidian reports it as
unavailable in the current context.

## Running a command

FR6. Give the model a tool that runs one allowed command by id.

FR7. Refuse a command id absent from the allow-list, and tell the model why,
rather than failing the turn.

FR8. Report back to the model what changed after a command ran: the active note
path, or that nothing opened.

FR9. Cap the number of commands one turn may run.

FR10. Record every command run in the panel history, named, before any edit
that follows it.

## Session rebinding

FR11. Rebind the session to the note a command opened, so subsequent edit tools
target it.

FR12. Leave the binding unchanged when a command opens no note.

FR13. Show the current binding in the panel, and show it changing.

FR14. Let the user return the session to the note it started on.

FR15. Resolve the rebound note's AGENTS.md chain before writing to it, per
release 3.

## Searching the vault

FR16. Give the model a tool that searches note content and returns matching
paths with surrounding excerpts.

FR17. Bound the result set, by match count and by excerpt length, so one search
cannot fill the context window.

FR18. Give the model a tool that reads one named note in full, without binding
the session to it.

FR19. Narrow a query by modification time, so "recently" changes the result set
rather than being ignored.

FR20. Cap the number of searches and reads one turn may perform.

## Answering from a search

FR21. Render a search-derived answer as its own panel entry, copyable, rather
than writing it into a note.

FR22. Name in that entry every note path the answer drew on.

FR23. Distinguish the answer entry from an edit entry in the panel, so a turn
that wrote nothing is not mistaken for one that did.

FR24. State plainly when a search found nothing, rather than answering from the
model's own knowledge.

## Flow separation

FR25. Never write a search result into a note, and never open a note the search
found. The search flow terminates at the panel.

FR26. Prefer a command over a search when the utterance names a destination and
an allowed command matches it.

FR27. Say that no command matched, rather than searching for a destination,
when an utterance names one the allow-list cannot reach.

## Non-functional requirements

NFR1. The model can only run commands from the allow-list. No prompt content,
skill, or AGENTS.md file can widen it.

NFR2. Commands run only through Obsidian's own execution path, never by calling
a plugin's internals.

NFR3. Command enumeration uses undocumented Obsidian API surface, so its
absence degrades to a harness with no command tool rather than a broken plugin.

NFR4. A turn's writes stay undoable through native Obsidian undo.

NFR5. Search cost stays bounded per turn regardless of vault size.

NFR6. Note content leaving the vault stays limited to what the turn needs: the
bound note, plus excerpts and notes a search returned.

NFR7. A vault where the user allows no commands behaves exactly as release 3,
with search still available.
