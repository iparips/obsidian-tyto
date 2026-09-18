---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: Session Tests

The two places the sixth ending is read: the transcript that records and renders it, and the panel that branches on it.

## TranscriptRepository

### recordEnding

Unchanged logic: it takes whatever kind it is given. Tests go in src/session/transcript/tests/transcript-repository.test.ts, under its existing "when a turn ends" describe block, which already asserts Exhausted, Stuck and Replied.

```text
records answered with the turn and the step it ended at
```

## TranscriptTurnSection

### answered

```text
if a later step of the turn exists return that step's slice
tail = the messages after this step
if no ending, or the ending is Replied or Answered, return the tail whole
return the tail trimmed of its last model note
```

Tests go beside the transcript section's own tests rather than in the repository file, since this reads a recorded ending rather than writing one.

```text
the ending is answered
  keeps the answer text in the last step's answer block
the ending is replied
  keeps the tail whole, as today
the ending is cancelled
  trims the harness note, as today
```

## SessionPanel

### runTurn

```text
dispatch transcript
result = await processUtterance(text)
if result.answered()
  dispatch turnAnswered
  notifySucceeded(result.outcome.value)
else if the outcome succeeded
  dispatch summary, then notifySucceeded, as today
else if the outcome was cancelled
  dispatch turnCancelled, as today
else
  dispatch failed, then notifyFailed, as today
```

Tests go in src/session/views/tests/SessionPanel.test.tsx. Its processUtterance mock returns an Outcome today and returns a TurnResult after this change, so every test in the file moves with the type while asserting what it asserts now.

```text
the turn ends answered
  writes no assistant entry
  settles a pending choice left by the turn
  returns the panel to idle
  notifies with the answer text
the turn ends replied
  writes the assistant entry, as today
the turn is cancelled
  notifies neither way, as today
```
