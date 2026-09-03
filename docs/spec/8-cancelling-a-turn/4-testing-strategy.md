# Cancelling a Turn: Testing Strategy

Unit test outline for [3-component-design.md](3-component-design.md). Follows
the repo's conventions: one dedicated case per branch, named "does X when Y".

The existing suites are the real check on the third Outcome case. A turn nobody
cancels must behave identically (NFR1), so any existing test needing its
assertions edited means behaviour moved where it should not have.

## TurnCancellation (Engine, new)

- Reports itself uncancelled before anything cancels it.
- Reports itself cancelled once cancelled.
- Aborts its signal when cancelled, so a request in flight stops.
- Leaves its signal unaborted while uncancelled.
- Resolves whenCancelled once cancelled.
- Leaves whenCancelled pending while uncancelled.
- Stays cancelled when cancelled twice, so a double click is harmless.

## Outcome (Shared, changed)

- Reports a cancelled outcome as cancelled.
- Reports a cancelled outcome as not failed, so a cancel is not an error.
- Reports a success as not cancelled.
- Reports a failure as not cancelled.

## MistralProvider (Providers, changed)

- Returns a cancelled outcome when the request is aborted.
- Returns a failure when the request fails for any other reason.
- Passes the signal to fetch when one is given.
- Completes normally when no signal is given, unchanged from today.

## EditEngine (Engine, changed)

- Runs no further tool call when cancelled between calls.
- Runs no further model call when cancelled between iterations.
- Returns a cancelled outcome when the turn is cancelled.
- Names the notes it wrote when cancelled after an edit.
- Names no note when cancelled before any edit.
- Records the cancellation in the chat history, so the next turn sees it.
- Leaves the session on the note it was on when cancelled.
- Releases the utterance queue when cancelled, so a later utterance runs.
- Completes normally when nothing cancels it, unchanged from today.

## TurnRepository (Engine, changed)

- Holds no written note before any edit lands.
- Holds the note when an edit lands.
- Holds both notes in order when a turn writes to two.
- Holds one entry when the same note is written twice.

## ToolDispatcher (Engine, changed)

- Refuses a tool call when the turn is cancelled.
- Applies an edit normally when the turn is not cancelled, unchanged from today.

## PanelReducer (Session, changed)

- Moves to the cancelling phase when a cancel is requested.
- Returns to idle when the cancellation lands.
- Appends a cancelled entry naming what was written.
- Appends a cancelled entry saying nothing changed when no note was written.
- Leaves the entries alone when a cancel arrives after the turn finished.

## SessionPanel (Session, changed)

- Renders Cancel in place of Send when a turn is thinking.
- Renders Cancel in place of Send while recording.
- Renders Send when the panel is idle.
- Offers no separate recording Cancel, since one button covers both.
- Cancels the recording when clicked while recording.
- Cancels the turn when clicked while thinking.
- Disables Cancel once clicked, so a second click does nothing.

## What is not unit tested

Aborting a real request. The provider's fetch is faked in the suite, so the
abort path is asserted through the fake's signal rather than a live socket. The
exit test covers the real one.
