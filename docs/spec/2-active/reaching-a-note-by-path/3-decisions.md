---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions: Reaching The Note

How a read and a write find the note they were asked for. What the panel says
about it is in [3-decisions-showing.md](3-decisions-showing.md).

## Requirements

### Decisions

#### D2: Does grep read the editor too? [open]

grep_notes reads every note in the vault with cachedRead, and the turn's note is
one of them, so a grep can return a line the editor no longer holds.

Not blocking, and narrower than D1: a grep answers a question about the vault
where a read informs an edit. D1 gives it the shape if it is wanted, since the
turn's note is one path among many a grep walks and the same comparison applies
to it.

What argues against is that a grep is a search. A hit whose text came from an
unsaved editor is a hit no other reader of the vault would find, and a search
that answers differently from the file is harder to reason about than one that
is merely stale.

#### D1: Where does a read of the turn's note come from? [resolved 2026-09-16]

The turn's note, from the editor the turn holds. Every other note, from the
file. Ilya chose it.

The comparison is the path being read against the turn's target, not against
whatever a tab shows. A turn knows the note it writes to, so a read_note for
that path is a read of the note being edited and comes from where the edits go.

| read_note is asked for | Comes from           | Because                                                |
| ---------------------- | -------------------- | ------------------------------------------------------ |
| The turn's target note | The editor it holds  | It is what anchors match and what unsaved typing is in |
| Any other note         | NoteReader, the file | It has no editor, or one that is not this turn's       |

Symmetrical with D3: writes go through the editor while it shows the target,
reads come from it when the path is the target, and the file serves both
otherwise.

A note open in another tab still reads from the file. That is deliberate: it is
not the turn's note, and reading its editor would make the answer depend on
which tabs the user happens to have open.

| Option                                      | Cost                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| The editor where the path is the turn's     | Chosen                                                                                               |
| Leave it, and say in the prompt which wins  | A rule the model must remember against a result in front of it                                       |
| Read the editor for every note that has one | A note open in another tab is not the turn's, and reads differ by what the user happens to have open |

NoteReader gains no collaborator. The turn already holds the note and its
editor, so the branch belongs where the read is dispatched rather than inside a
reader whose job is files.

#### D3: What does an edit write through? [resolved 2026-09-16]

An edit writes through an Editor the turn resolved once and held. Obsidian gives
an editor to a leaf rather than to a file, so switching tabs leaves the same
handle showing a different note, and the write lands there. Two sessions have
put an item into the wrong note that way, and the second did it after the
resolve was fixed, so the handle is the remaining cause.

Ilya: write through the editor unless it no longer shows the file the tool wants,
and where they differ the tool wins.

| Option                                             | Wrong note is                      | Cost                               |
| -------------------------------------------------- | ---------------------------------- | ---------------------------------- |
| The editor where it shows the path, else the vault | Impossible, the path is checked    | Two write paths to keep alike      |
| Re-locate the editor by path each write            | Refused, since the path is gone    | Stops the turn when the tab closed |
| Write through Vault.process always                 | Impossible, the file is the target | The cursor and undo, below         |

Ilya's is the first: write through the editor where it still shows the path the
tool named, and through the vault where it does not. The check is the whole of
it, since the path is already in hand and the editor reports the file it shows.

That keeps what the editor is good for in the case that is almost always true.
The user has the note open, the write lands in Obsidian's undo stack, and the
cursor follows the edit. Only a tab that moved falls back, which is the case
that is silently wrong today.

Vault.process reads, modifies and saves one file atomically, addressed by TFile,
so the fallback cannot go astray. It also removes the not-editable-yet failure,
since a note needs no editor to be written.

Two things the fallback costs, and both are confined to it.

- The cursor. setCursor and scrollIntoView need an editor, so focusing the edit
  is skipped on the vault path. A user whose tab has moved was not watching that
  note anyway.
- Undo. D5 of
  [following-the-user-mid-turn](../following-the-user-mid-turn/3-decisions-editing.md)
  weighed the whole-note write partly on Ctrl-Z reversing a model edit, and said
  so because every edit goes through the editor and nothing writes to the vault
  directly. A vault fallback makes that untrue for the writes that take it.

Whether undo survives a Vault.process write to an open note is unknown, and the
API does not say. It is five minutes in a real vault: write that way to an open
note and press Ctrl-Z.

The answer no longer decides the option, which is what makes this better than
writing through the vault always. It decides only how loud the fallback should
be: if undo is lost there, the write is worth saying so in the panel, since a
user cannot take back what they were not told about.

### Assumptions

- Obsidian writes an editor to disk on its own schedule, so the window where the
  two disagree is short but real. The reported session hit it through a
  different cause, so this has not been seen on its own. If the window turns out
  to be too short to matter, the prompt line from D1's second option is enough
  and NoteReader keeps its single collaborator.

## Design

Written when the design is.
