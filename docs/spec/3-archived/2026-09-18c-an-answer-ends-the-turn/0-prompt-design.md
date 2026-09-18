---
created: 2026-09-18
updated: 2026-09-18
---

# Design Prompt: An Answer Ends The Turn

Paste the block below into a fresh session. The requirements, decisions and acceptance criteria are done; the design is not.

```text
Write the design for docs/spec/2-active/2026-09-18c-an-answer-ends-the-turn.
Design only: no production code, and nothing under src/ changes this session.

Read 1-index.md, then 2-requirements.md, 3-decisions.md, 4-acceptance-criteria.md.
All four decisions are resolved — implement them rather than reopening them.
Nothing is left for you to settle about the behaviour; what is open is how it is
built, and the three calls below are where that is hardest.

The change: answer_from_search ends the turn it is called in. Today it publishes
the answer and returns an ordinary outcome, so the loop runs another step and
the model restates the answer as text. The panel shows both blocks, and the
worse one is what reaches the chat history.

Load the sdd skill and follow references/design-conventions.md, plus the
code-generation, code-unit-tests, mermaid and text-generation skills. This repo
has no feature flags and no logging layer: drop the Feature flag, Gating and
Logging sections and the flag precedent search, and draw one sequence diagram
with no alt branch on a flag. Read docs/architecture/1-overview.md before adding
a file, 2-vocabulary.md before calling anything a turn, a turn step or a
progress line, and 4-the-turn.md before moving anything about how a turn ends.

Verify before trusting, all read 2026-09-18: tool-dispatcher.ts:202 is
publishModelAnswer and :231 askUser; ToolCallOutcome carries result,
editEndPosition, refusal, panelSummary and wroteThrough, and nothing that ends a
turn; TurnEndingKind has five values; EndedTurn carries kind and outcome, and
ConversationTurnRunner.recordEndingAndGetOutcome returns the outcome alone;
Outcome is a union of Success, Failure and Cancelled narrowing through `this is`;
SessionPanel.runTurn branches succeeded / wasCancelled / else.

The hardest call is how a tool call tells the loop to stop. ToolCallExecutor
loops a reply's calls and returns void, so nothing any call produces reaches the
runner today. Say what ToolCallOutcome gains, how the executor carries it out of
the loop over a batch, and where the runner reads it.

D3 constrains this: every call in the batch runs and the ending applies once the
step is complete, so the ending cannot be a return that breaks the loop early.
The fact has to outlive the remaining calls. Say what happens when a batch
carries two answers.

Second: the kind travels back to the panel. Per D1, run returns the ending kind
beside the outcome, and EditEngine.processUtterance and UtteranceQueue both sit
on that path, so the queue's promise type moves with it. Say what the returned
shape is, what SessionPanel branches on, and what notifySucceeded fires with —
an answered ending writes no entry but still notifies, since it is the only
thing reaching a user whose panel is off screen.

Third, and easy to miss: per D4 the answer text is appended to the chat history
as a model message. That makes this a TurnEndingService method beside
endTurnWithModelUtterance rather than a TurnOutcomes one, and the dispatcher is
where the answer text is known. Say how the text reaches the ending without the
dispatcher becoming turn-aware.

Secondary: the vocabulary doc is wrong once this lands, in two places. Its
endings table has five rows, and it states that an answer never reaches the chat
history — true only because a Replied ending always followed. Both are yours to
correct as part of the design, per D4.

Plan unit tests against src/engine/tests/conversation-turn-runner-endings.test.ts,
edit-engine-harness.test.ts (which has a "when the turn answers from a listing"
describe block asserting the current continue behaviour), and
src/session/transcript/tests/transcript-repository.test.ts. The panel branch
wants a test beside src/session/views/tests/SessionPanel.test.tsx. Use the
helpers in src/test-support.

Check your work with `bun run test`, not `bun run verify`: verify runs prettier
over the repo and writes main.js, leaving a diff to unpick from the design.

Where the spec is wrong, say so and fix it rather than designing around it. Its
code claims were checked on 2026-09-18 in this checkout, and the prompt that
produced it carried three that had already moved.
```
