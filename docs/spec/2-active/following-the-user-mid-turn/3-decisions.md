---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

What is still open. The four settled ones, with the reasoning that settled them,
are in [3-decisions-settled.md](3-decisions-settled.md).

## Requirements

### Decisions

#### D6: How does an anchored edit avoid going stale? [open, blocking]

D5 guards a whole-note write. This is the same question for the edit tools that
stay, and Ilya asked it directly: bit-by-bit edits need something too.

The staleness is structural rather than a model failing. NoteContextMessage is
rebuilt per turn step, not per tool call, so every anchor in one batch is
computed from the same snapshot and the note moves underneath them as the batch
applies. The model is never shown the note between its own calls.

| Option                                      | Catches                          | Cost                                              |
|---------------------------------------------|----------------------------------|---------------------------------------------------|
| Stop the batch at the first refusal         | Damage after the first miss      | Taken as D3, and it contains rather than prevents |
| Send the note again after each applied edit | The model's picture drifting     | A note-sized message per call in a batch          |
| Refuse a batch whose anchors overlap        | The drift before any of it lands | A rule for overlapping, computed against the note |
| One edit per step, never a batch            | All of it                        | A model call per edit, so an archive costs twelve |

The second option is what the model would do for itself if it could: it is a
read_note after every write. The cost is that a note the size of the reported
todo file is sent once per call, and a batch of five sends it five times.

The fourth is the honest one. A batch exists because a model call is expensive,
not because the edits belong together, and every defect in this spec comes from
calls in one batch not seeing each other. Whether an archive can afford twelve
model calls is the question, and the whole-note tool from D5 is what makes the
answer not matter: one call, one write.

Blocking. D3 contains the damage and does not stop the drift, so something here
has to answer for the edit tools that remain after D5.

#### D4: Is the model told its anchors go stale within a batch? [open]

The system prompt says multi-part instructions become multiple tool calls
applied in order. It does not say that an anchor computed from the current note
is stale once a sibling call lands.

Not blocking, and it is a prompt change, which this repo treats as a behaviour
change needing a real vault to judge. Worth doing only if D3 leaves cases where
a model can still batch overlapping anchors.

### Assumptions

- A refused anchor means the model's picture of the note is stale, rather than
  the anchor being wrong from the start. Both produce the same refusal. If a
  first-call refusal is common in practice, stopping the batch punishes a model
  that got one anchor wrong and the rest right.

## Design

Written when the design is.
