---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D1: Where does a read of the open note come from? [open, blocking]

The note the session is bound to has an editor, and that editor is what the edit
tools write through. Every other note has only a file.

| Option                                         | Cost                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Read the editor when the path is the open note | NoteReader needs the locator, which it has kept out of                                               |
| Leave it, and say in the prompt which wins     | A rule the model must remember against a result in front of it                                       |
| Read the editor for every note that has one    | A note open in another tab is not the turn's, and reads differ by what the user happens to have open |

Blocking: it decides whether NoteReader gains a collaborator or the prompt gains
a line, and those are different changes.

The first is the recommendation. An anchor is matched against the editor, so a
read that informs an anchor should come from there. The third is tempting and
wrong: which notes have editors is the user's tab state, and a tool whose answer
depends on that is one whose answer is not reproducible.

#### D2: Does grep read the editor too? [open]

grep_notes reads every note in the vault with cachedRead. The open note is one
of them, so a grep can return a line the editor no longer holds.

Not blocking, and narrower than D1: a grep answers a question about the vault
where a read informs an edit. If D1 lands on reading the editor for the open
note, grep can take the same treatment for the one path it shares.

### Assumptions

- Obsidian writes an editor to disk on its own schedule, so the window where the
  two disagree is short but real. The reported session hit it through a
  different cause, so this has not been seen on its own. If the window turns out
  to be too short to matter, the prompt line from D1's second option is enough
  and NoteReader keeps its single collaborator.

## Design

Written when the design is.
