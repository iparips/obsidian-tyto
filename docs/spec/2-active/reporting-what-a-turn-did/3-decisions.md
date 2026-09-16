---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D4: Should a batch stop after a refusal? [open]

The failing session ran a refused call and an applied call in one batch, and the
model had no way to tell which result belonged to which. Stopping at the first
refusal is a behaviour change beyond reporting, so it is raised rather than
assumed.

Not blocking, and weaker now than when it was raised. D3 stops a malformed name
from producing a result at all, and D2 tells two real results apart. What is
left is a batch where an edit is genuinely refused and a later one applies,
which is a narrower case than the one that was reported.

#### D1: Is a retarget a session event or a history message? [resolved 2026-09-16]

A session event, as a restore is. Ilya chose it. The retarget step and the
history message both go; a retargeted entry kind takes their place.

Recording a retarget made it two things at once: a panel step, and a system
message appended to the chat history. Both defects come from those two choices
rather than from recording it at all. A history message can land between a tool
call and its result; a step has to belong to a turn, and a restore leaves the
entry PanelReducer.withStep scans for above the restore marker.

A restore is the same kind of event and has neither problem. It is its own
PanelEntry kind, reaching the panel and the transcript, never the model. Nothing
appends it to the history, so no tool pair can be split; it is not a step, so no
turn has to own it.

| Option                                 | Model is told | Cost                                                            |
|----------------------------------------|---------------|-----------------------------------------------------------------|
| A session event, as a restore is       | No            | Gives up the model half of recording-a-retarget                 |
| Keep the step, move the history write  | Yes           | Fixes neither defect on its own; still needs a turn and a slot  |
| Append as a user message, not a system | Yes           | Weakens the framing that this is the harness speaking           |
| Hold it until the tool batch closes    | Yes           | New turn state, and a retarget between turns still needs a path |

One change retires both defects, copying a pattern already in the tree.

What it gives up is the model half, resolved as D2 of recording-a-retarget on
the grounds that the model otherwise sees consecutive turns on different notes
with nothing explaining the jump. Two things reduce that cost.

- NoteContextMessage is built per call and sent last, names the current path,
  and says it supersedes any earlier description. The model is already told
  which note it is on, every turn.
- That spec's own assumption contemplated the fallback: if the message
  misbehaves, the model half comes out and the other two stay.

Two consequences follow, and neither is separate work. The reducer is untouched,
because a retarget stops being a step. Recording a retarget now ships with its
own D2 reversed, so that spec is amended rather than left disagreeing with this
one.

#### D2: What does an applied edit tell the model? [resolved 2026-09-16]

The operation and the note it reached, plus the position. Not the content.
Ilya: naming the operation and the note is fine.

`applied` carries no tense and no target, which is what let the model read it as
an earlier edit.

| Option                             | Cost                                                   |
|------------------------------------|--------------------------------------------------------|
| Name the operation and the note    | Chosen                                                 |
| Echo the content back as well      | Doubles arbitrarily long text already in the history   |
| Say only that this call applied it | A batch of edits gives identical results, one per call |

The content is the half the model needs least: it sent the text one message
earlier, so the result restating it pays twice for the same tokens. A dictated
paragraph makes that cost unbounded. What the model cannot infer is which call
this result belongs to and where it landed, and the note path and position are
short and fixed-cost. ApplyResult already carries endedAt, so the position costs
nothing to report.

#### D3: Is an unknown tool name refused before dispatch? [resolved 2026-09-16]

Yes. Ilya: refuse it before it reaches the edit tool, so there is only one
result to read.

ToolDispatcher.execute treats anything that is not a harness tool as an edit,
so a malformed name reaches NoteOperationParser and is refused there. The
refusal is correct and the wording is not: it echoes the name, and it arrives
from the edit tool rather than from the dispatcher.

Refusing against the offered set is what makes the batch case safe.
ToolCatalogue.forCapabilities already builds that set for the turn, so the
dispatcher has a list to check against without a new source of truth.

This is the primary fix for the phantom edit. D2 narrows what a batch can be
misread as; this removes the second result that was misread at all.

### Assumptions

- The model sending its reasoning as a function name is a provider defect, not
  something the prompt causes. It appeared once, on mistral-medium-latest. The
  spec therefore hardens the dispatcher rather than changing the prompt. If it
  recurs across models, the tool schema descriptions are the next place to look.
- The model does not need telling that the note changed, because
  NoteContextMessage names the current path on every call and asserts it
  supersedes the conversation above it. This is what D1 rests on. If a real
  vault shows the model reaching back to the previous note once the retarget
  message is gone, the message returns and D1 falls back to one of the options
  that keeps it.
- A retarget between turns sits on the panel timeline unattached, which is what
  a restore already does. If an entry with no turn around it reads as loose in a
  real vault, the fix is how it renders, not where it goes.

## Design

Written when the design is.
