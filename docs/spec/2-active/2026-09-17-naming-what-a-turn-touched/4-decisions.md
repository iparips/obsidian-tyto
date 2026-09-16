---
created: 2026-09-17
updated: 2026-09-17
---

# Decisions

## Requirements

### Decisions

#### D3: How loudly does the panel announce a vault write? [resolved 2026-09-17]

As a warning. Ilya chose it.

A write that falls back to the vault costs the cursor, and may cost undo. The
user cannot take back an edit they were not told about, so the line has to carry
more weight than the ordinary progress line the edit already publishes.

| Option                          | Says the edit may not be undoable | Cost                                      |
| ------------------------------- | --------------------------------- | ----------------------------------------- |
| A warning entry beside the turn | Yes                               | Chosen                                    |
| A refused-style progress line   | Yes                               | Reads as a failure where the write worked |
| An ordinary progress line       | No                                | A user who cannot undo is not told        |

A warning rather than a refusal because the write worked: the note holds what
the user asked for, and only the way back is in doubt. Marking it refused would
say the opposite of what happened.

The warning entry kind already exists and already lands inside the open turn.
Its one producer today is the step budget running low, which is the same shape
of news: the turn is fine, and something about it is worth knowing.

The undo question stays open and no longer blocks anything. If undo survives a
Vault.process write the warning is louder than it needs to be, which is the
safer way to be wrong. Recorded as an assumption below rather than a decision,
since the answer changes the wording and not the design.

#### D1: Does the user's mid-turn move still show? [resolved 2026-09-17]

No. Ilya: a mid-turn move by the user should not show.

The lines made sense when the header named one note and a turn could not say
what it was writing to. A turn now holds its target, so the lines narrate a
header that is gone.

| Option                      | Says where the next turn starts  | Cost                                      |
| --------------------------- | -------------------------------- | ----------------------------------------- |
| Show nothing                | No                               | Chosen                                    |
| Keep a line per move        | Only by implication, three times | Narrates a header that no longer exists   |
| One line when the turn ends | Yes                              | A fact about the session in a turn's list |

The retargeted entry kind goes with it: the user's move was its only producer,
so nothing is left to render. Eleven entry kinds become ten.

This reverses part of archived spec 32, which made the retarget a session event
with its own entry. That was right while the header was the only thing naming a
note. The target moving onto the turn is what makes the entry redundant.

The retargets channel stays. The panel still has to know the session's note
changed, because that is the target the next turn opens with.

#### D2: Which progress lines name their target? [resolved 2026-09-17]

Only a line whose note differs from the turn's target. Ilya chose it.

| Option                                | Cost                                          |
| ------------------------------------- | --------------------------------------------- |
| Only where it differs from the target | Chosen                                        |
| Every line that touched a note        | Repeats the turn's target down the whole list |
| Only lines that wrote                 | A read from the wrong note stays invisible    |

The turn names its target at the top, so repeating it on every line is noise
that buries the one line worth seeing. A line acting on another note is the
case that was invisible, and it is the only case that needs saying.

A line that touched no note names none. A glob asks about names and a date
resolve asks about a calendar, so neither has a target to differ from.

### Assumptions

- Undo does not survive a Vault.process write to an open note. Neither the
  Obsidian API nor its typings say, and the probe needs a keystroke in a running
  vault. The warning is worded for the worse case; if undo turns out to survive,
  the wording softens and nothing else moves.
- The note a progress line acted on is knowable where the line is built. Each
  factory is called from the tool that did the work, which has the path in hand.
  If some line turns out not to know its note, that line carries none and the
  rule holds for the rest.

## Design

Written when the design is.
