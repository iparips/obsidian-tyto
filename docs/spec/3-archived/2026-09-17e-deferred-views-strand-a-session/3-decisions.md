---
created: 2026-09-17
updated: 2026-09-17
---

# Decisions

## Requirements

### D1: Does the transcript fix ship with the locator fix? [resolved 2026-09-17]

Yes, one change. Ilya. The report arrived pointing at the wrong turn, so the
next one would too.

Two defects, one report. The locator strands the session; the transcript
misattributes the setup lines of the turn that was refused.

| Option                   | Cost                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| One spec, one change     | A prompt-free bug fix carries a reporting change nobody asked to review |
| Split the transcript out | The next report of this bug arrives misattributed again                 |

The locator work does not read the transcript code, so a builder can take either
half first.

### D5: What happens when the target will not resolve? [resolved 2026-09-17]

Nothing moves on screen. A deferred leaf is loaded in place and the write goes
through its editor; a note with no leaf at all is written through the vault. The
turn is never refused, and the user is never navigated anywhere.

| Option                                   | Cost                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Refuse the turn, as today                | A dead session the user can only leave by discarding the conversation  |
| Open unbound and let the model reopen it | open_note calls openFile on the active leaf, which pulls the user away |
| Load in place, vault write where no leaf | Undo is lost on a note with no tab, and the panel has to say so        |

Ilya: the panel saying a note is not open is never the helpful answer, and the
user must not be jerked back to the editor when they chose to be on the panel.

Two facts decided the shape. loadIfDeferred loads a view without activating or
revealing it, so the common case keeps undo and the cursor while the user stays
put. And NoteOpener.reveal (engine note-binding) calls openFile on the active
leaf, so having the model reopen a closed note would move the user to it, which
is the behaviour being removed rather than a way out.

So the model is not involved in reaching the note at all. TargetNoteWriter
(engine note-editing) already falls back to vault.process when the editor does
not hold the note, and the panel already marks that write "Undo not available".

ResolutionFailed (engine note-binding) loses its only caller and comes out, so
the resolution goes from three states to two.

### D6: What focuses the note when a turn ends? [resolved 2026-09-17]

Only an edit to the note the user is already looking at. Ilya: the refocusing
experience is jerky, particularly on mobile.

focusEdit (engine note-editing) runs setCursor and a centred scrollIntoView at
turn end, from TurnEndingService (engine). Its current guard is tabShowsPath,
which asks whether the note has an editor, not whether the user is on it.

| Option                    | Cost                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| Guard on the active tab   | Tightens a guard that already exists                               |
| Skip on mobile only       | The first platform branch in the codebase, and desktop still jerks |
| Drop the centring flag    | Smaller movement, but still moves a note the user is not reading   |
| Remove the focus entirely | Loses seeing what changed on desktop, where it is wanted           |

Compare the note's editor against workspace.activeEditor (Obsidian). On mobile
the panel holds the screen, so the comparison fails and nothing scrolls, with no
platform check written anywhere.

### D7: Does ResolutionFailed come out entirely? [resolved 2026-09-17]

No. It stays, with its only remaining cause a path that is not a markdown note.
Settled in the design, correcting D5, which said the class loses its last caller
and comes out.

D5 read the locator as having one failure. It has two, and only one of them is
the failure D5 removes.

| Option                                   | Cost                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------- |
| Keep ResolutionFailed for non-markdown   | The resolution keeps three states rather than dropping to two         |
| Remove it and vault-write anything bound | A session bound to a canvas has its JSON rewritten as markdown        |
| Remove it and guard inside the writer    | The same guard, further from the message that explains it to the user |

WorkspaceNoteLocator.notOpenMessage (engine note-binding) branches on the .md
extension. The markdown branch is what D5 replaces with a vault write. The other
branch names a canvas, a PDF or a Bases file, and tells the user to press Reset,
because no amount of opening gains such a path an editor.

Vault-writing that path is worse than refusing it.
TargetNoteWriter.writeThroughVault (engine note-editing) guards only on the file
having a stat, which every one of those satisfies, so the write would land and
corrupt the file. D5's reasoning, that the panel saying a note is not open is
never the helpful answer, does not carry here: the message is not asking the
user to open anything, it is saying the session is on something it can never
edit.

ActiveNote.path (wiring) already refuses to bind a session to a non-markdown
file, so this is reached only by a rename under a live session. It is kept
anyway: the cost of dropping it is a corrupted file, and the cost of keeping it
is one branch.

#### Assumptions

- The transcript defect is cosmetic, so it cannot strand a session or lose an
  edit. If a refused turn can also drop the lines belonging to a turn that did
  run, it stops being cosmetic and sorts above the locator fix.
- A model told the path it lost reaches that note rather than a near neighbour.
  The path names the folder and the filename, which is more than the user's
  words carry. If it picks wrong notes in practice, the answer is a confirming
  choose_note rather than a return to refusing.

## Design

### D3: Does the locator stay synchronous? [resolved 2026-09-17]

No. locate becomes async, and so does the FakeNoteLocator (test-support)
override that follows it. Settled in the design: the ripple is two production
callers and both are already inside async methods, so nothing above them
changes.

| Option                            | Cost                                                     |
| --------------------------------- | -------------------------------------------------------- |
| Make locate async                 | Ripples to callers; resolveFor (engine) is already async |
| Add an async loader beside locate | Two entry points, and the sync one keeps the bug         |

What decided it was reading the two callers. TargetNoteResolver.resolveFor
(engine note-binding) is already async and awaits the chain after the locate, so
it takes an await and nothing else. TargetNoteWriter.tabShowsPath (engine
note-editing) is synchronous, but its two callers are not the same: it is
awaited inside editorHoldsTheNote, which is async already, and read from
focusEdit, which is not.

D6 takes focusEdit off tabShowsPath and onto workspace.activeEditor (Obsidian),
which is a field read rather than a search. So the one caller that would have
forced a synchronous locate stops calling it, and the two changes fit together
rather than fighting.

The second option was rejected on the same ground as D2's first: an entry point
that still holds the bug is one a later change reaches for, with no compile
error to say it chose wrong.

### D4: Is the load guarded on the API version? [resolved 2026-09-17]

No guard. minAppVersion goes to the latest, 1.13.0. Ilya.

isDeferred and loadIfDeferred both arrived in 1.7.2, and the manifest says
1.5.0, so the fix would otherwise need requireApiVersion around every call.
Raising the floor past 1.7.2 deletes that branch and the older code path with
it.

The community-plugin-submission spec already raises minAppVersion to 1.13.0 for
the declarative settings API. This fix depends on that bump rather than making
one of its own, so the two specs must not set different floors. Whichever lands
first owns the manifest edit.

### D2: How is a deferred leaf matched to a path before it is loaded? [resolved 2026-09-17]

Load deferred leaves until one matches, and check the loaded leaves first. Ilya,
with the ordering refinement added on review.

Loading must be narrowed, per the Obsidian warning about loading sparingly. A
deferred leaf carries no file, so the match cannot be made the way the current
code makes it.

| Option                                        | Cost                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| Read getViewState().state.file                | state is an untyped Record, so the key is undocumented and can change silently |
| Load every deferred markdown leaf, then match | Discards the optimisation Obsidian added, across the whole workspace           |
| Load deferred leaves until one matches        | Bounded by the tab count, but loads leaves that were never the target          |

Two things decided it. The state key is undocumented, so option 1 fails the way
this bug failed: no compile error, no test failure, a stranded session after an
Obsidian release. And the search is ordered, so the cost is not what the table
implies.

Order the search: match the leaves that are already loaded, then load deferred
ones one at a time until a path matches. The target is usually the visible tab,
so the common path loads nothing and behaves as it does today. The miss path
loads a few background tabs and then finds nothing, which is the case D5 hands
to the model rather than refusing.

#### Assumptions

- getLeavesOfType('markdown') returns deferred leaves, so the leaf holding the
  target is findable without the file. Obsidian's guide says an instanceof check
  is required on what that call returns, which only makes sense if it does. If
  the call filters them out, the leaf must be reached through getActiveFile or
  the leaf iterator, and D2's options all change.
- A leaf loaded by loadIfDeferred stays loaded for the rest of the turn, so one
  load per resolve is enough. If Obsidian re-defers a background leaf while a
  turn is still spending steps, a later write in the same turn fails the way
  this bug does and the load has to move next to each write.
- A leaf that is not deferred behaves as it does today, so the ordered search in
  D2 changes nothing on the common path. If Obsidian ever hands back a loaded
  view with a stale file, the match has to be re-read after the load rather than
  before it.
