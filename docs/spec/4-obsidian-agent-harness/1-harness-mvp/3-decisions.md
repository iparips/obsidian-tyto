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

## Settled by the design

Command enumeration, search implementation and the iteration cap are resolved
in [4-component-design.md](4-component-design.md). Search needs no private API:
prepareSimpleSearch is exported. Commands need two private methods, reached
through one module augmentation and guarded by a probe. The cap rises to 10 and
stays a single number.

## Settled while building

Command effect verification stays the before-and-after diff, plus one check the
build added: a note a command opened but that has no editor does not move the
binding. CommandRunner (Commands) reports the diff, and ToolDispatcher (Engine,
new) downgrades the report to "no note opened" when the rebind cannot find an
editor. The model is told the binding stayed, so its next anchor targets the
note it can actually write to.

The answer entry reuses the copyable entry with a second row. Sources render
below the body under their own class, so copying yields the answer alone and the
citation count is visible without reading it. An accent border separates it from
an assistant entry, which is what FR29 asks for.

The mobile settings surface is a textarea plus a collapsed count. Entries are
one per line, which scrolls on a phone and needs no per-row controls. The
resolved list sits behind a summary reading "N commands allowed right now", so a
pattern's reach is one tap away rather than filling the screen (FR7, FR8).

Core commands are not distinguished from community ones, and no denylist ships.
The allow-list starts at daily-notes:* and the user adds the rest, so a
destructive core id is only reachable if they type its namespace. A denylist
would suggest the allow-list is safe to widen carelessly, which it is not.
