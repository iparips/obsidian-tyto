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

Patterns match on the colon, not on length. A command id is namespaced as
plugin-id:command-id, so a pattern confined to one plugin can only reach what
that plugin registered. That is a boundary worth enforcing. A minimum character
count is not: file* is four characters and reaches file-explorer:delete-file,
while editor:toggle-* is fourteen and reaches nothing but formatting. Length
does not track danger, so the rule is structural instead.

Patterns are necessary, not a convenience. Some plugins generate command ids
positionally rather than from a name: open-or-create-file-command registers its
commands as an array index, so the ids read as :0, :1, :2 and shift meaning when
the user reorders their configs. Enumerating those ids by hand would produce an
allow-list that silently means something else after a settings change. A
namespace pattern is the only stable way to express "all of this plugin's
commands".

The allow-list stays live rather than resolved once. A pattern is re-evaluated
against the command list each session, so a newly added command matching an
existing pattern is included. That is the point of a pattern, and the cost is
that the reach of an entry changes without the user editing it, which FR7
answers by showing what it currently resolves to.

The prompt instruction is defence in depth, never the enforcement. A prompt
line is advisory: it degrades under unusual phrasing, and a model that misreads
it fails silently. If it were load-bearing, NFR1 would be false. The allow-list
is what makes a command unreachable, and the instruction earns its place only in
the gap the allow-list leaves, where a namespace pattern swept in more than the
user pictured.

The instruction turns on uncertainty, not on a category. The model sees id and
name pairs, so it cannot reliably tell what a command does. "Delete current
file" is legible; a community plugin's "Clean up" is not. Asking it to avoid
destructive commands invites a confident guess about which those are. Asking it
to decline what it cannot identify is a judgement it can actually make, and it
pairs with FR14, which reports the effect after the fact.

Deny patterns are out. Allow-only keeps precedence trivial and keeps the
settings surface small enough for a phone. A user who wants a subset of a
namespace lists those ids individually.

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

The settings surface has no mobile design yet. A resolved allow-list can run to
dozens of commands, which is unreadable on a phone, and the plugin already
targets mobile. FR7 and FR8 state the requirement: show what a pattern resolves
to, and keep it scrollable. Whether that is a collapsed count, a searchable
list, or a read-only summary with editing left to desktop is a design question.

Core commands are not distinguished from community ones. The colon rule permits
file-explorer:* as readily as open-or-create-file-command:*, and the former
includes deletion. Decide whether a denylist of known-destructive core ids is
worth carrying, or whether the user choosing what to add is protection enough.
