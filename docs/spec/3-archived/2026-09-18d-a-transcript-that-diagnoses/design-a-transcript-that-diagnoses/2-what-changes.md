---
created: 2026-09-18
updated: 2026-09-18
---

# What Changes, And What Does Not

Four of the six additions need code. Two do not, and saying so is part of the design rather than a gap in it.

| Requirement             | Verdict   | Why                                                                                             |
| ----------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| The model's own words   | Changes   | The text is dropped at the provider boundary and never reaches the history, per D1              |
| An empty slice says why | Changes   | A failed provider call renders "nothing recorded", which blames the model for a harness failure |
| An empty search result  | No change | SearchReport's reason travels in the tool result, which the next step's Request block renders   |
| A verbatim repeat       | Changes   | Same call and same result within the turn, marked where it recurs, per D3                       |
| The step budget         | Changes   | The charge is recorded per step and the running total renders on every step, per D2             |
| applicable_skills       | No change | It is an argument on the call and renders inside that call's JSON, per D4                       |
| A prompt version        | No change | The appendix writes every part's full text, so two transcripts are compared by diffing, per D5  |

## Behaviour Change

No feature flag, so the table compares today against the change rather than two flag states.

| Concern                                 | Today                                                    | New                                                                  |
| --------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| Reply carrying text and tool calls      | toChatTurn keeps the calls and drops the text            | ChatTurn carries both, and the response block renders both           |
| That reply on the way back to the model | toApiMessage hardcodes content to empty                  | The text is sent back, so the model reads its own last reply in full |
| Restored session                        | StoredMessages.assistant drops content on a call message | Content is read back, and SESSION_SNAPSHOT_VERSION does not move     |
| A step whose provider call failed       | nothing recorded                                         | no reply recorded: the provider call did not return                  |
| A step whose reply was genuinely empty  | nothing recorded                                         | the model returned an empty reply                                    |
| Every turn step                         | No budget line                                           | Spend: 3 charged, 7 of 20 used                                       |
| A verbatim repeated call                | Renders identically to the first                         | tool call grep_notes - repeats step 1, on the recurrence only        |
| What a recorded step holds              | Parts, history range, progress-line range                | Plus the charge the step drew                                        |

## Why The Empty Slice Is A Wording Fix

The step really did record nothing, and what it has to say is why. The harness never reached the model, so no message was appended and the slice is empty by construction.

Three of the six endings write nothing to the history at all. TurnOutcomes (Engine Turn Ending) builds Exhausted and Stuck, Failed returns without appending, and only TurnEndingService (Engine) writes. A realistic exhausted turn therefore renders its last step's tool calls today, and the one path leaving an empty slice is a provider call that failed.

TranscriptTurnSection.closesWithTheModelsOwnWords (Session Transcript) exempts Replied and Answered from the truncation, which is the same distinction read from the other side: those two close the tail with the model's words, and the other four close it with the harness's.
