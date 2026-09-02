# Search and Answering

How the vault is searched, and why the answer stops at the panel. Part of the
[component design](05-component-design.md).

## Search Scores, It Does Not Rank By Recency

VaultSearch (Search, new) runs prepareSimpleSearch over every markdown file's
cached contents and keeps the scored hits (FR21). Recency is a filter applied
before scoring, not a term added to it (FR24): "recently" narrows the candidate
set by mtime, then the query decides order within it.

Keeping the two separate is what makes "recently" mean something. Folding
modification time into the score would let a stale exact match outrank a fresh
relevant one, and neither the user nor the model could tell which had happened.

Cost is bounded by construction (NFR6). cachedRead is Obsidian's own cache, the
hit list is capped by count, and each excerpt is cut to a fixed width around the
match offset the SearchResult already carries. A vault of any size costs one
pass and a fixed payload.

NoteReader (Search, new) reads one named note in full for the case where an
excerpt is not enough (FR23). It never binds the session, which is what keeps
the search flow read-only.

## The Answer Never Becomes an Edit

The search flow terminates at the panel (FR30). No tool writes a search result
into a note, and the design has no path that could.

That is enforced by tool inventory rather than by instruction. The search tools
return text to the model; the edit tools take an anchor in the bound note. There
is no tool that takes a search result and a destination, so the model cannot
compose one even if an utterance asks for it.

The answer reaches the panel as its own entry kind, carrying the paths it drew
on (FR27, FR28). SessionPanel (Session) already renders entries by kind and
makes them copyable, so this is a fourth kind beside user, assistant and error,
not a new mechanism.
