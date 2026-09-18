---
created: 2026-09-18
updated: 2026-09-18
---

# Prompt: Spec An Answer Ending The Turn

Hands the requirements phase to a fresh session. The spec folder holds only this
file, so the prompt carries the evidence: the session that found the defect read
it out of a panel transcript and the code, and that reading dies with it.

Spent once `2-requirements.md` and `3-decisions.md` land. Keep it as the record
of what the phase was asked for.

```text
Write the requirements for a change to Tyto's turn loop: answer_from_search
should end the turn, rather than leaving the model another step in which to say
the same thing again.

The spec folder exists and holds only this prompt:
docs/spec/2-active/2026-09-18c-an-answer-ends-the-turn

Read CLAUDE.md first. It sets the spec stages, says a new spec goes in 2-active,
and points at docs/architecture. Read docs/architecture/2-vocabulary.md before
naming anything: a turn, a turn step and a progress line are three different
things and this change touches all three.

Load the sdd skill and follow its Write Requirements workflow. Requirements and
decisions only. Write no design, and change nothing under src.

## The defect, as observed

A user asked for themes across three weeks of reflection-tagged notes. The model
searched, read ten notes, and called answer_from_search. The answer reached the
panel. The turn then continued, the model spent one more step writing a shorter
version of the same answer as text, and the panel showed both: one answer block
and one reply block, saying the same thing twice. The user wants the first alone.

## What the code does today, read 2026-09-18

- src/engine/tool-dispatcher.ts:202, publishModelAnswer: publishes the answer to
  the panel, then returns ToolCallOutcome.of('the answer reached the panel; say
  nothing further about it'). An ordinary outcome, so the loop continues.
- src/engine/turn/conversation-turn-runner.ts, runTurnStep: a turn ends when the
  model replies in text, when the user cancels, when the provider fails, when
  the refusal counter is stuck, or when the step budget runs out. A tool cannot
  end a turn. Verify this list against the file rather than trusting it.
- src/engine/turn/ending/turn-ending-kind.ts: the five endings, one per way the
  loop can stop. A transcript reads the ending off this rather than inferring it.
- src/engine/tool-call-outcome.ts: what a tool call did, as the loop sees it. It
  carries a refusal and an edit position; it carries no way to say "stop".

The instruction in that result text is what the model ignored. Treat prompt text
as evidence of intent, not as a mechanism: this session spent a day finding that
advisory rules lose to whatever the model would otherwise do, and the fix is
usually to remove the opportunity rather than to word the rule again.

## The distinction that matters

ask_user is not the same shape, and a requirement that lumps them together is
wrong. src/engine/tool-dispatcher.ts:231, askUser: it publishes a progress line,
awaits the user's answer, and returns that answer as the tool result. The turn
has to continue, because the answer is what the next step acts on.

answer_from_search is terminal: nothing can carry its answer into a note, and
there is nothing for a later step to act on. Say in the requirements which tools
end a turn and which only pause it, and why the two differ.

## Questions the requirements have to settle

These are the decisions file's, not the design's. Each changes what gets built:

1. Does the answer become the turn's outcome, or does the turn end with no
   reply? The runner returns an Outcome<string> that the panel and the
   transcript both read. An answer that ends a turn has to say what that string
   is.
2. Is there a new TurnEndingKind, or does this reuse Replied? A transcript reads
   the ending off that enum, so "answered" and "replied" being the same value
   means a reader cannot tell a cited answer from a bare reply.
3. What happens to a batch? A reply may carry several tool calls, and one of
   them being answer_from_search does not stop the others having run. Decide
   whether the calls beside it still apply and whether that is a defect of its
   own.
4. Does anything else deserve the same treatment? choose_note and the
   confirm flow are worth a look before deciding this is answer_from_search
   alone. Do not widen the scope on your own; name what you found and leave it
   out of scope with a reason.

## Scope

In: what ends a turn, and what the panel and the transcript show when an answer
does. Out: how the answer is rendered, which is already done, and the batch
charging in 2026-09-18b, which is a separate spec.

## Acceptance criteria

The observable check is one answer block and no second reply for a question
answered from search. Write it as something a person runs against a real vault,
since whether the model would have talked again is not a unit test.

## If the evidence is wrong

Everything above about the code was read on 2026-09-18 by a session that then
kept working in the same checkout. Check each claim before building on it, and
if a line has moved or a name has changed, correct the requirements and say what
you corrected rather than writing around it.
```
