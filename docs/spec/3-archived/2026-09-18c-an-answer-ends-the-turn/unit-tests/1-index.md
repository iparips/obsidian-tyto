---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: Unit Tests

The test plan for [../design-ending-on-an-answer/1-index.md](../design-ending-on-an-answer/1-index.md). One heading per production method the design changes. The checks a person runs are in [../4-acceptance-criteria.md](../4-acceptance-criteria.md).

- [2-engine.md](2-engine.md) - ToolCallExecutor, ConversationTurnRunner and TurnEndingService
- [3-session.md](3-session.md) - TranscriptRepository, TranscriptTurnSection and SessionPanel

Four test files take the new leaves, and every one already exists. Each method below names the one it goes in. All four use the helpers in src/test-support: anEngine and aToolTurn for the engine files, and the SessionPanel file's own renderPanel.
