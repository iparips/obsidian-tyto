---
created: 2026-09-18
updated: 2026-09-18
---

# Prompt: Build An Answer Ending The Turn

Hands the build to a fresh session. The spec is complete and every decision is resolved, so this carries the reading order and the claims worth re-checking, and nothing the spec already says.

```text
Build the change specified in docs/spec/2-active/2026-09-18c-an-answer-ends-the-turn:
answer_from_search ends the turn it was called in, and the answer text becomes the
turn's closing message in the chat history.

Read CLAUDE.md first, then design-ending-on-an-answer/1-index.md and its five files.
Read 3-decisions.md when a choice looks open: all five decisions are resolved, and a
design that reads as arbitrary usually has a decision behind it. The commit order is
the design's Rollout section; there is no tasks file.

Defer these until the commit that needs them:
- unit-tests/2-engine.md before commits 1 and 2, unit-tests/3-session.md before 4 and 5
- docs/architecture/2-vocabulary.md before commit 6, which is where its endings table
  and its entry-kinds prose are corrected

CLAUDE.md owns the conventions, the skills to load, the architecture docs to read
before adding a file, and how to build. Follow it rather than this prompt on all four.

Verify before trusting, all read 2026-09-18 in this checkout:
- ToolCallExecutor.executeToolCalls returns Promise<void> today, at
  src/engine/turn/tool-call-executor.ts:29. The design's whole mechanism is that this
  returns the batch's first answer instead.
- ConversationTurnRunner.executeToolCalls runs the stuck check before the spend, at
  src/engine/turn/conversation-turn-runner.ts:62. Where the answer is read depends on
  that order still holding.
- TranscriptTurnSection.answered special-cases Replied at
  src/session/transcript/transcript-turn-section.ts:100. Commit 5 exists only for this.
- PanelReducer's answer case leaves the phase where it was, at
  src/session/models/panel-reducer.ts:51. That is why turnAnswered is a new action
  rather than a reuse of the answer one.

The unit suite cannot judge the thing this change exists to fix: whether a real model
given a real question now leaves the answer alone. Run all six checks in
4-acceptance-criteria.md against a real vault and a real API key before calling it
done, and report them by name.

Where the spec is wrong, say so and fix the spec rather than designing around it. It
was written against this checkout on 2026-09-18, and two of its own claims were wrong
when the design checked them, so expect more.
```
