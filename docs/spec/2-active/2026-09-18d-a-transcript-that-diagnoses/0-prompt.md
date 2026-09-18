---
created: 2026-09-18
updated: 2026-09-18
---

# Prompt: Build A Transcript That Diagnoses

Hands the build to a fresh session. The spec is complete and every decision is resolved, so this carries the reading order and the claims worth re-checking, and nothing the spec already says.

```text
Build the change specified in docs/spec/2-active/2026-09-18d-a-transcript-that-diagnoses:
the transcript renders the model's reply when it carried text alongside tool calls, what
each step spent of the turn's budget, and which calls a turn repeated verbatim.

Read CLAUDE.md first, then design-a-transcript-that-diagnoses/1-index.md and its six
files. Read 3-decisions.md when a choice looks open: all five are resolved, and two closed
on changing nothing, so a design that declines to act usually has a decision behind it.
The commit order is the design's Rollout section; there is no tasks file.

Read each unit-tests file before the commit it covers, per that folder's index. CLAUDE.md
owns the conventions, the skills to load, the architecture docs to read before adding a
file, and how to build. Follow it rather than this prompt on all four.

Verify before trusting, all read 2026-09-18 in this checkout:
- TranscriptTurnSection is constructed by TranscriptDocument.write at
  src/session/transcript/transcript-document.ts:17. RepeatedCalls is turn-scoped, so the
  design's per-turn construction has no site yet and this is where you choose one.
- ConversationTurnRunner returns before spendOn when the turn is stuck, at
  src/engine/turn/conversation-turn-runner.ts:68. A stuck step draws no charge, so the
  budget line's absence has to read as that rather than as a defect.
- spendOn passes calls.length to the counter, at conversation-turn-runner.ts:78, and an
  answered turn is charged before it ends. chargeOfLastSpend records what that call
  charged rather than recomputing it.
- StoredMessages.of persists content for a tool-call message, at
  src/session/models/session-snapshot.ts:45. If it does not, the restore is no longer one
  line and SESSION_SNAPSHOT_VERSION moves.

Commit 2 changes what the model reads of its own last reply, which the unit suite cannot
judge. Run the three manual checks in the design's testing file against a real vault and
a real API key before starting commit 3, and report them by name. Then run all five
checks in 4-acceptance-criteria.md before calling it done.

The spec was designed before 2026-09-18c merged, which added a sixth ending and changed
the runner and the executor. Line numbers were refreshed against that merge; the claims
were not re-derived, so check them.

Where the spec is wrong, say so and fix the spec rather than designing around it. Its
central claim about the "nothing recorded" symptom was wrong and the design corrected it,
so expect more.
```
