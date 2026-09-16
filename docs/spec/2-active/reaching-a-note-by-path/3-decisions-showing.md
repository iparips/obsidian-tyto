---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions: Showing The Note

What the panel says about the note a turn is writing to. How that note is
reached is in [3-decisions.md](3-decisions.md).

## Requirements

### Decisions

#### D4: What does the header say while a turn runs? [open, blocking]

The header names the session's note. A turn can hold a different one, and does
whenever a command opens a note or the user moves while it runs, so the header
can name one note while the edits go to another.

| Option                                  | While the turn writes elsewhere               | Cost                                      |
| --------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| Name the turn's note while one runs     | The header follows the turn, then the session | The header moves twice per turn           |
| Name both, the turn's marked as live    | Both visible, and which is which              | Two lines where the panel is narrow       |
| Name the session's, warn when they part | A warning beside the name                     | Says something is odd without saying what |

Blocking: it decides whether the panel needs the turn's note at all, which is a
prop that does not exist and a channel to carry it.

The second is the recommendation. What the user wants to know before speaking is
where the next utterance lands, and that is the session's note, so replacing it
while a turn runs takes away the answer to the question they are actually
asking. Naming both keeps it and adds the one they cannot currently get.

The third is cheapest and says least. A warning that two things differ, without
naming the second, leaves the user to open files to find out, which is what both
reported sessions cost.

#### D5: Does the panel show the turn's note when it matches? [open]

Where the turn and the session agree, which is most of the time, a second line
repeats the first.

Not blocking. Showing it only when they differ is quieter and makes the
difference itself the signal, at the cost of a header that changes shape. Always
showing it is steadier and mostly redundant. Either way D4 decides whether the
prop exists.
