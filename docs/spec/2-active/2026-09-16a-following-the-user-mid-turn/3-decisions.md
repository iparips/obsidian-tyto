---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

Every decision is settled. The two here are about the turn the user moved under;
the ones about how an edit is written at all are in
[3-decisions-editing.md](3-decisions-editing.md).

## Requirements

### Decisions

#### D1: What happens to a turn the user retargets under it? [resolved 2026-09-16]

It finishes on the note it started. Ilya: the note change kicks in only once the
original utterance has been processed.

The turn is mid-instruction on one note and the user opens another. Following is
the rule and this spec does not reopen it; what the running turn does about it is
what was unsettled.

| Option                           | The archive turn would have                     | Cost                                                        |
| -------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Continue, and tell the model     | Carried on, told the note changed               | The model may still finish an instruction on the wrong note |
| Finish on the note it started    | Completed the archive, bound the new note after | Chosen                                                      |
| End the turn, saying what it did | Stopped, named the edits already applied        | An instruction half-applied, which is the state to avoid    |

An utterance is the unit the user asked for, so half-applying one is what to
avoid. Ending the turn leaves the instruction incomplete instead, which is the
same harm moved. Finishing and then following leaves neither partial.

The session still binds to the new note when the event fires. What defers is the
running turn's own target, so the turn writes where it began and the next starts
where the user is.

A command opening a note mid-turn is untouched: ToolDispatcher reaches the turn
repository directly, where the user's retarget arrives through the runner.

#### D2: Does the model need telling at all? [resolved 2026-09-16]

No, and D1 settles it. A turn finishing on the note it started never sees the
new one, so there is nothing to tell it, and the next turn reads the change in
its own note context as every between-turn retarget already does.

Archived spec 33's removal of the history message therefore stands unamended.

### Assumptions

- A turn finishing on the note the user has left is short enough that they do
  not see edits landing in a note they are no longer watching. A turn is a
  handful of model calls, and the panel names the note each edit reached. If a
  long turn makes that read as the session ignoring them, the fallback is to
  end the turn instead, which D1 weighed and did not take.

## Design

Written when the design is.
