---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D1: What happens to a turn the user retargets under it? [open, blocking]

The turn is mid-instruction on one note and the user opens another. Following is
the rule and this spec does not reopen it; what the running turn does about it is
unsettled.

| Option                           | The archive turn would have                     | Cost                                                        |
|----------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| Continue, and tell the model     | Carried on, told the note changed               | The model may still finish an instruction on the wrong note |
| Finish on the note it started    | Completed the archive, bound the new note after | The user watches edits land on a note they have left        |
| End the turn, saying what it did | Stopped, named the edits already applied        | An instruction half-applied, which is the state to avoid    |

Blocking: it decides whether the fix is a message, a deferral or an ending, and
those touch different classes.

The third is the recommendation. The user moving away mid-instruction is a
signal the turn is no longer what they are watching, and an edit tool with no
undo should stop rather than guess. It also matches what a cancel already does,
which archived spec 8 settled: name the notes written and stop.

#### D2: Does the model need telling at all? [open]

Only the continue option needs a message; the other two end or defer the turn.
Raised separately because it reopens what archived spec 33 removed.

That spec dropped the history message because it split a tool call from its
result and the provider rejected the sequence. A message sent at the top of the
next step, rather than appended the moment the event fires, has no such problem:
the pair is closed by then.

Not blocking. If D1 ends the turn, this decision disappears.

#### D3: Does a batch stop at the first refused edit? [open, blocking]

Archived spec 33 raised this as D4 and left it open, calling the case narrower
than the one reported. The reported session is that case.

| Option                                | Cost                                                              |
|---------------------------------------|-------------------------------------------------------------------|
| Stop the batch at the first refusal   | A batch of independent edits loses the ones after the failure     |
| Apply all, report each                | What happens today, and what duplicated the user's content        |
| Refuse the batch when anchors overlap | Needs a rule for what overlapping means, computed before applying |

Blocking: it decides whether the fix is in the executor loop or in the anchor
check, and the second is a larger change.

Stopping at the first refusal is the recommendation. An anchor that missed is
evidence the model's picture of the note is stale, and every later anchor in
that batch was computed from the same picture.

#### D4: Is the model told its anchors go stale within a batch? [open]

The system prompt says multi-part instructions become multiple tool calls
applied in order. It does not say that an anchor computed from the current note
is stale once a sibling call lands.

Not blocking, and it is a prompt change, which this repo treats as a behaviour
change needing a real vault to judge. Worth doing only if D3 leaves cases where
a model can still batch overlapping anchors.

### Assumptions

- The user opening a note mid-turn is rare enough that ending the turn costs
  little. This session is the first sighting. If it turns out common, ending
  every time is worse than continuing with the model told, and D1 falls back to
  the first option.
- A refused anchor means the model's picture of the note is stale, rather than
  the anchor being wrong from the start. Both produce the same refusal. If a
  first-call refusal is common in practice, stopping the batch punishes a model
  that got one anchor wrong and the rest right.

## Design

Written when the design is.
