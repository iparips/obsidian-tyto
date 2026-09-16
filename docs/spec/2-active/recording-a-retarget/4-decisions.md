---
created: 2026-09-16
updated: 2026-09-16
---

# Decisions

## Requirements

### Decisions

#### D1: Should a retarget reach the transcript, the panel list and the model? [resolved 2026-09-16]

All three. Ilya: a session read back should say when it changed note, and a
chat message telling the model the target moved is fine.

The three destinations were weighed separately, since only one carries risk:

| Destination   | Read by                  | Risk                          |
| ------------- | ------------------------ | ----------------------------- |
| Transcript    | A person, after the fact | None, never reaches the model |
| Panel list    | The user, live           | None, one more entry          |
| Model history | The model, next turn     | See D2                        |

### Assumptions

- A retarget is worth recording on every tab switch. A user moving between two
  notes repeatedly produces one entry each time, and the panel list is already
  collapsed. If that reads as noise in a real vault, the panel half is the part
  to reconsider, not the transcript.

## Design

### Decisions

#### D2: Where does a retarget between turns go? [resolved 2026-09-16]

Appended to the chat history the moment it happens, and rendered into the
transcript from there. Ilya asked for it recorded as it happens and reaching the
model, which the history already does without a turn.

| Option                           | Cost                                               |
| -------------------------------- | -------------------------------------------------- |
| Attach to the turn that follows  | Reads as part of a turn it preceded                |
| Hold and emit with the next turn | Two retargets between turns collapse into the last |
| A transcript section of its own  | A new section kind, outside the per-turn structure |
| Append to the history            | Chosen                                             |

Enqueueing it as a turn was considered and rejected. EditEngine.runTurn appends
a user message, builds a runner and calls the provider. A tab switch would then
cost an API call and let the model act on a navigation the user asked nothing
of. UtteranceQueue also serialises, so a switch during a running turn would fire
behind it.

The history costs none of that. SessionRepository.appendChatMessage writes into
the same list PromptFactory sends, so the model reads the retarget on its next
real turn, in the position it happened. TranscriptSource already carries
chatHistory, so the transcript renders it without a new section kind.

### Assumptions

- A past-tense event in the history does not make the model drag the target
  back. Archived spec 29 found that behaviour and named NoteContextMessage as
  one cause, which asserts the current note last and says it supersedes
  everything above. The message this spec adds names no note and states a past
  event, so it should read differently. Only a real vault confirms it, which is
  what AGENTS.md asks for on any prompt change. If it does drag the target
  back, the model half comes out and the other two stay.
