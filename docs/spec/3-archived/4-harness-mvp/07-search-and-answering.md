# Search and Answering

How the vault is searched, and why the answer stops at the panel. Part of the
[component design](05-component-design.md).

## Search Scores, It Does Not Rank By Recency

Superseded by [10-finding-notes](../10-finding-notes/1-index.md). VaultSearch is
deleted, and this section describes a scorer no longer in the codebase. NoteGlob
and NoteGrep (Search) replace it: a glob over paths and a grep over content,
both exact.

The recency filter goes with it. Both new tools take a sort field instead, so
"recently" orders the results rather than narrowing them by an mtime cutoff the
model had to pick a number for.

The bounded cost survives the replacement. Each tool walks getMarkdownFiles
once, caps its result count, and cuts each excerpt to a fixed width, so a vault
of any size costs one pass and a bounded payload.

NoteReader (Search) reads one named note in full for the case where an excerpt
is not enough (FR23). It never binds the session, which is what keeps the search
flow read-only.

## The Answer Never Becomes an Edit

The search flow terminates at the panel (FR30). No tool writes a search result
into a note, and the design has no path that could.

That is enforced by tool inventory rather than by instruction. The glob and grep
tools return text to the model; the edit tools take an anchor in the bound
note. There is no tool that takes a search result and a destination, so the
model cannot compose one even if an utterance asks for it.

The answer reaches the panel as its own entry kind, carrying the paths it drew
on (FR27, FR28). SessionPanel (Session) already renders entries by kind and
makes them copyable, so this is a fourth kind beside user, assistant and error,
not a new mechanism.
