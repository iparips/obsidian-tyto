---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

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

#### D1: What happens to a turn the user retargets under it? [resolved 2026-09-16]

It finishes on the note it started. Ilya: the note change kicks in only once the
original utterance has been processed.

The turn is mid-instruction on one note and the user opens another. Following is
the rule and this spec does not reopen it; what the running turn does about it is
what was unsettled.

| Option                           | The archive turn would have                     | Cost                                                        |
|----------------------------------|-------------------------------------------------|-------------------------------------------------------------|
| Continue, and tell the model     | Carried on, told the note changed               | The model may still finish an instruction on the wrong note |
| Finish on the note it started    | Completed the archive, bound the new note after | Chosen                                                      |
| End the turn, saying what it did | Stopped, named the edits already applied        | An instruction half-applied, which is the state to avoid    |

An utterance is the unit the user asked for, so half-applying one is the state
worth avoiding. Ending the turn avoids it by leaving the instruction incomplete,
which is the same harm in a different place. Finishing the instruction and then
following is the only option that leaves neither the note nor the utterance in a
partial state.

The session binds to the new note the moment the event fires, as it does today.
What defers is the running turn's own target, so the turn writes where it began
and the next turn starts where the user is.

A command opening a note mid-turn is untouched. ToolDispatcher reaches the turn
repository directly, where the user's retarget arrives through the runner, so
deferring one leaves the other as archived specs 31 and 32 left it.

#### D2: Does the model need telling at all? [resolved 2026-09-16]

No, and D1 is what settles it. A turn that finishes on the note it started never
sees the new one, so there is nothing to tell it. The next turn reads the new
note in its own note context, which is what every retarget between turns already
relies on.

Archived spec 33's removal of the history message therefore stands unamended,
rather than needing the narrower version this spec was opened to consider.

### Assumptions

- A turn finishing on the note the user has left is short enough that they do
  not see edits landing in a note they are no longer watching. A turn is a
  handful of model calls, and the panel names the note each edit reached. If a
  long turn makes that read as the session ignoring them, the fallback is to
  end the turn instead, which D1 weighed and did not take.
- A refused anchor means the model's picture of the note is stale, rather than
  the anchor being wrong from the start. Both produce the same refusal. If a
  first-call refusal is common in practice, stopping the batch punishes a model
  that got one anchor wrong and the rest right.

## Design

Written when the design is.
