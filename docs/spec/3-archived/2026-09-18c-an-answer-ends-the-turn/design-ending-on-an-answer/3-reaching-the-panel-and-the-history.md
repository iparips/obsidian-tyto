---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: The Kind, The Text And The Transcript

Where the ending kind travels to, where the answer text travels to, and the one site outside the enum that assumes five endings.

## How the kind reaches the panel

TurnResult (Engine Turn Ending, new) is the pair: the kind and the outcome. It is a class rather than a tuple, so the panel reads result.answered() rather than destructuring a positional pair, and so EditEngine (Engine) and UtteranceQueue (Engine) relay one value rather than two.

ConversationTurnRunner.recordEndingAndGetOutcome (Engine Turn) becomes recordEndingAndGetResult, returning TurnResult built from the EndedTurn it already holds. The rename is the method's whole change: it records the same kind and returns the same outcome, now without dropping the kind.

The type moves along the path unchanged at each hop. EditEngine.processUtterance and EditEngine.runTurn return Promise of TurnResult, and UtteranceQueue's runFn and enqueue take and return the same. The queue's failure relay in runTurn, which builds an Outcomes.failure when the runner could not be built, wraps that failure in TurnResult.of with a Failed kind, since a turn that never started still ended.

### What SessionPanel branches on

SessionPanel.runTurn (Session Views) gains one branch ahead of the three it has. The existing three are untouched, and their order is unchanged.

- result.answered(): notify with the answer text, and dispatch turnAnswered rather than summary.
- Otherwise: the outcome's shape decides, exactly as today.

The new branch is first because it is the narrow case. An answered ending is always a success, so a shape-first read would take the summary branch and write the entry this spec removes.

turnAnswered (Session Models, new) is a PanelAction carrying nothing. PanelReducer (Session Models) settles it through AskedEntries.turnEnded and sets the phase idle, with no entry appended. It is the summary case minus the entry, and it is needed because the answer action the dispatcher already published leaves the phase where it was: publishing an answer mid-turn must not end the turn, so the phase move belongs to the ending rather than to the answer.

notifySucceeded fires with the answer text. A user whose panel is off screen has nothing else telling them the turn finished, and the answer is what the turn concluded, so the notice says the same thing the panel shows.

## How the answer text reaches the ending

TurnEndingService.endTurnWithAnswer (Engine, new) sits beside endTurnWithModelUtterance and does what D4 requires: appends the answer as a model message, then returns an EndedTurn carrying Answered.

It appends the answer text alone, not the sources. It does not focus the edit either. endTurnWithModelUtterance scrolls to the last edit because a turn that edited and then spoke has a cursor worth following; a turn that answered from search wrote nothing, so there is no position to move to.

The dispatcher stays turn-unaware. It never calls the ending service and never learns that answering is terminal: it builds ToolCallOutcome.answered, which is a value, and the two classes between it and the ending carry the text the rest of the way. ToolDispatcher.publishModelAnswer (Engine) changes one line, from ToolCallOutcome.of to ToolCallOutcome.answered, and its result text drops the instruction to say nothing further, since the model no longer gets a step in which to say anything.

## The transcript's Replied branch

TranscriptTurnSection.answered (Session Transcript) trims the turn's closing message from the last step's tail on four of the five endings, and keeps the tail whole for Replied. The comment above it names five endings and has to name six.

Answered joins Replied in keeping the tail whole. The trimmed endings are the ones whose closing message is the harness speaking, such as the cancelled note; Answered appends the model's own answer, so trimming it would drop the very text D4 puts there.

The spec does not name this site. It is the one place outside the enum where a fifth ending was assumed, and it fails quietly rather than loudly: the transcript would still render, one message short.
