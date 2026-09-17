---
created: 2026-09-11
updated: 2026-09-11
---

# Tasks

Four commits. The first three leave nothing on screen, so the button lands last
with something to copy.

## Commit 1: the store

TranscriptRepository (Session, new), holding what a session's turns spent. No
caller yet, so nothing else in the suite moves.

- A recorded turn step holds its four parts, the range of chat history it was
  sent, and the range of panel steps it owns, closed by the next recording
- A part is kept only when its text differs from the last kept for that part,
  and a step cites the version it used
- A recorded ending holds its kind and the step it was reached at
- The open step's panel range advances as panel steps are published from
  outside, and closes on the next recording or the turn's end

Tests are the TranscriptRepository cases in [5-test-plan.md](5-test-plan.md).

## Commit 2: recording a turn

Three call sites write to the store, and none of them changes what the model is
sent.

- SessionBuilder (Session) constructs the store and the session repository and
  passes both to EngineFactory.build, which forwards them through
  TurnRunnerFactory to ModelService and ConversationTurnRunner
- ModelRequestMapper (Model) gains toParts, so ModelService records what each
  part said without rebuilding any of them and toMessages still returns the same
  list
- ModelService records the three stored parts before the provider call
- EndedTurn (Engine) gains the ending kind beside the outcome, and run records
  it once on whatever reaches it. TurnEndingService and TurnOutcomes each return
  a named EndedTurn from the endings they build, so the cancel-or-failure
  decision is made in one place and ConversationTurnRunner names no kind
- SessionProgress advances the open panel range in publishStep

The suite stays green: every constructor gains an argument, and the builders in
src/test-support cover them for the tests that build a turn.

## Commit 3: the document

TranscriptDocument (Session, new), pure: panel entries, records and settings in,
one Markdown string out.

- The metadata table, without the API key
- One section per conversation turn: utterance, Setup, turn steps, each with its
  three labelled blocks
- The appendix, each part written once under its version

The format is [4-sample-output.md](4-sample-output.md), and the
TranscriptDocument cases in the test plan assert against it.

## Commit 4: the setting and the button

OwlSettings (Settings) gains transcriptCopyEnabled, false by default, with a
checkbox in SettingsPanel following the searchEnabled block. PanelHeader
(Session) gains Copy beside Reset, and SessionPanel (Session) passes it what the
document needs.

- Absent unless the setting is on, the way Reset is absent without onReset
- Disabled while a turn runs and while there are no entries
- The clipboard call and copied-state label from HistoryEntry
- aria-label Copy transcript

## After the commits

Copy a real failing session and paste it into a note. The format is a judgement
the suite cannot make: check that the repeated steps read as repeats, and that
the appendix holds one copy of each prompt part rather than one per step.

The transcript classes sit in session/transcript rather than in the session
root, which was already at eight files and would have gone over the ten-file
limit with them in it.
