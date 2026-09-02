# Decisions: Obsidian Agent Harness

Choices made in [1-requirements.md](1-requirements.md), and what a design must
settle before implementation starts.

## Decisions

Commands are the routing primitive, not paths. The user already has a daily note
command, a shopping list command, and whatever their plugins add. Reusing them
inherits their configuration, which the plugin would otherwise duplicate and
drift from.

The allow-list is explicit, not inferred. Obsidian ships commands that delete
files, toggle vault settings, and open external links. An allow-list is the only
mechanism that keeps a spoken instruction from reaching them.

Rebinding is a tool result, not an implicit side effect. The model must be told
the binding moved, or it will apply the next anchor to the wrong note.

A search answer stops at the panel. Every other step in a turn fails loudly: a
search returns hits or none, a command opens a note or it does not, an anchor
matches or it does not. A summary always produces plausible text, whether or not
it read the right notes. Writing it automatically hides the one step that cannot
report its own failure. A copyable block puts the user between the judgement and
the note, which is where verification actually happens.

Cited paths ship with the answer, not later. They are what separate a summary
the user can trust from one that merely reads well, and an answer citing two
notes when the user expected six is visibly wrong at a glance.

The model never chooses a write path. Opening a note through a command is
Obsidian computing a path from the user's configuration. Creating a note at a
path the model picked is a guess, and it fails the same way search-and-edit
does. Both wait for a later release.

Search stays available when no command is allowed. The two flows share nothing
but the loop, so neither should gate the other.

## Open questions

Command enumeration is not in the public Obsidian API. The Command interface is
public, but the registry holding them is not typed. Confirm in the design what
runtime surface is available, and what the fallback is when it changes.

Search has no public API either. Decide between a plugin-side scan over
getMarkdownFiles and cachedRead, and driving Obsidian's own search view. The
scan is typed and testable; the search view matches what the user sees.

Iteration cap sizing is unresolved. The search flow spends calls on search and
reads before it answers, and the current cap of 6 was set for single-note
editing. Decide whether the cap rises, or becomes per-flow.

Command effects are unbounded from the plugin's point of view. Running one and
then diffing the workspace is the only way to know what it did. Decide how much
of that the harness verifies before it lets an edit follow.

Answer entries may need their own panel affordance. Release 4 has copyable
history entries, but an answer carries cited paths and no edit, so it may want a
distinct shape rather than reusing the edit entry.
