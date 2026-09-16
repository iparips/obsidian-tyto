---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions: Showing The Note

What the panel says about the note a turn is writing to. How that note is
reached is in [3-decisions.md](3-decisions.md).

## Requirements

### Decisions

#### D4: Where does the user learn which note a turn is writing to? [open, blocking]

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

Ilya's is the first: take the note out of the header and make the target a
per-turn fact, prominent once the turn has determined it.

It answers what the other three work around. A header names one note with no
turn attached to it, so it cannot say which utterance that note belongs to, and
the rest are ways of decorating a field that is in the wrong place. A target
belongs beside the turn that chose it, where the timeline already carries the
entries saying a note changed.

The header is left with Copy and Reset, which is a toolbar and reads as one.

What it gives up is the answer before speaking. Today the header says "No note
open" or names one, and a user reads it before an utterance. Under this they
learn the target from the turn that determined it, which is after they have
spoken. Whether that matters turns on how often a user speaks without already
knowing where it will land, and the reported sessions say nothing either way.

#### D5: What does a turn show before it has a target? [open]

A turn determines its note partway through: an utterance naming the shopping
list runs a command first, and the target is known only once that returns. Under
D4's first option there is a window where the turn exists and its target does
not.

Not blocking, and only D4's first option raises it. Showing nothing until the
target lands is honest and leaves the turn briefly unlabelled. Showing the note
the session was on is a guess that is usually right and wrong exactly when it
matters, which is the failure this spec exists to fix.
