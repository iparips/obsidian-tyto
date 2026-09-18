---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: Design

answer_from_search ends the turn it was called in, so the model never gets the step it spends restating the answer. The answer text becomes the turn's own closing message in the chat history, replacing the restatement that sits there today.

- [2-behaviour-and-stopping-the-loop.md](2-behaviour-and-stopping-the-loop.md) - the behaviour change table, what ToolCallOutcome gains, where the runner reads it, and the one sequence diagram
- [3-reaching-the-panel-and-the-history.md](3-reaching-the-panel-and-the-history.md) - the returned pair, the panel's fourth branch, the appended answer, and the transcript's Replied branch
- [4-new-interfaces.md](4-new-interfaces.md) - every signature the change adds or moves
- [5-docs-and-rollout.md](5-docs-and-rollout.md) - the two architecture docs this corrects, what is out of scope, the commit order and the references
- [../unit-tests/1-index.md](../unit-tests/1-index.md) - the test plan, across four files that already exist

Three calls carry the design, one per decision that reaches code.

- The answer text rides back on ToolCallOutcome (Engine), the executor holds the first one it sees until the batch finishes, and the runner reads it after the stuck check (D3).
- TurnResult (Engine Turn Ending, new) pairs the kind with the outcome along the runner, EditEngine and UtteranceQueue path, and SessionPanel (Session Views) branches on the kind ahead of the outcome's shape (D1, D2).
- TurnEndingService.endTurnWithAnswer (Engine, new) appends the answer, so the dispatcher never learns that answering is terminal (D4).
