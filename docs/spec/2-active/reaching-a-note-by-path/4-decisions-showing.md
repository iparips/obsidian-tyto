---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions: Showing The Note

What the panel says about the note a turn is writing to. How that note is
reached is in [4-decisions.md](4-decisions.md).

## Requirements

### Decisions

#### D5: What does a turn show before it has a target? [open]

A turn determines its note partway through: an utterance naming the shopping
list runs a command first, and the target is known only once that returns. Under
D4's first option there is a window where the turn exists and its target does
not.

Not blocking, and only D4's first option raises it. Showing nothing until the
target lands is honest and leaves the turn briefly unlabelled. Showing the note
the session was on is a guess that is usually right and wrong exactly when it
matters, which is the failure this spec exists to fix.

#### D4: Where does the user learn which note a turn is writing to? [resolved 2026-09-16]

The header names the session's note. A turn can hold a different one, and does
whenever a command opens a note or the user moves while it runs, so the header
can name one note while the edits go to another.

| Option                                   | Says which utterance the note belongs to | Cost                                        |
| ---------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| No note in the header, a target per turn | Yes, it sits beside the turn             | The header stops answering before you speak |
| Name the turn's note while one runs      | Only while it runs                       | The header moves twice per turn             |
| Name both, the turn's marked as live     | Only while it runs                       | Two lines where the panel is narrow         |
| Name the session's, warn when they part  | No                                       | Says something is odd without saying what   |

Blocking: it decides whether the header keeps a note at all, and whether the
panel needs the turn's note as a prop that does not exist today.

The note comes out of the header, and the turn part of the panel is redesigned
around its target. Ilya: the target note becomes the most prominent feature of a
turn.

That is more than moving a field. A turn is not a container today: the entry
list is eleven flat kinds, and what belongs to one turn is worked out by finding
the last user entry and reading forward. A target that is the most prominent
thing about a turn needs the turn to be a thing first.

It answers what the other three work around. A header names one note with no
turn attached to it, so it cannot say which utterance that note belongs to, and
the rest are ways of decorating a field that is in the wrong place. A target
belongs beside the turn that chose it, where the timeline already carries the
entries saying a note changed.

The header is left with Copy and Reset, which is a toolbar and reads as one.

What it gives up is the answer before speaking. Today the header says "No note
open" or names one, and a user reads it before an utterance. Under this they
learn the target from the turn that determined it, which is after they have
spoken. Ilya accepted that: a target that is wrong is worth seeing against the
turn it was wrong for, and a header naming a note before a turn exists was
answering a question the panel could not actually answer.

#### D6: Does a turn become a container in the entry list? [resolved 2026-09-16]

Yes, a real one. Ilya chose it.

D4 asks for the target to be the most prominent thing about a turn, and a turn
is not a thing to be prominent about. PanelEntry is eleven flat kinds, and what
belongs to one turn is found by scanning back to the last user entry, which is
how a retarget once joined the wrong turn after a restore.

| Option                                 | Cost                                                          |
| -------------------------------------- | ------------------------------------------------------------- |
| A turn entry holding its own entries   | The reducer, the transcript and the record all change shape   |
| A turn header entry, siblings after it | Cheap, and the grouping stays a convention rather than a fact |
| Style the existing entries by turn     | Cheapest, and says nothing the scan-back does not already say |

Blocking: it decides whether this is a panel change or a change to what a panel
entry is, and the second reaches the stored record.

The second was weighed and not taken. A header entry would carry the target and
read as a block without the reducer learning to nest, but the grouping would
stay inferred, and an inferred grouping is what put a retarget in the wrong turn
after a restore.

A container makes the turn the thing that holds its target, its steps and its
reply, so the target has somewhere to be prominent and nothing has to scan back
to find out what belongs where. TranscriptTurn.split stops inferring turns and
reads them, and PanelReducer stops finding the open steps entry by looking for
the last user entry.

The cost is real and spread: the reducer nests, the transcript reads a shape it
used to build, and the stored record changes, which SESSION_SNAPSHOT_VERSION
exists for. A restored session written by the old shape is discarded rather than
migrated, per archived spec 22.
