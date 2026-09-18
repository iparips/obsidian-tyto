---
created: 2026-09-18
updated: 2026-09-18
---

# Prompt: Design A Transcript That Diagnoses

Hands the design phase to a fresh session. The requirements are written and both blocking decisions are settled, so what this prompt carries is which decisions are closed, which are the design session's to close, and which claims about the code were verified on 2026-09-18 against a checkout that kept moving afterwards.

```text
Design the spec in docs/spec/2-active/2026-09-18d-a-transcript-that-diagnoses.

This is design only. Write no production code, change nothing under src, and do
not start building what you design. A design doc plus its unit test plan is the
whole deliverable.

Read in this order: 1-index.md, 2-requirements.md, 3-decisions.md, then
4-acceptance-criteria.md. Read docs/architecture/2-vocabulary.md before naming
anything: a turn, a turn step and a progress line are three different things and
the transcript renders all three. Read docs/architecture/1-overview.md before
adding a file, and 4-the-turn.md for engine's own folder layout.

The change: Tyto's session transcript is what defects are diagnosed from, and six
things about it cost a real session time. The spec says which to fix and what the
transcript may grow by.

D1, D2 and D3 are resolved and are implemented, not reopened.

- D1: the reply text is carried through ChatTurn and ChatMessage rather than
  marked as lost. This reaches outside the transcript package, and it is
  symmetric: MistralMapper.toApiMessage strips content on the way out as
  toChatTurn drops it on the way in. Both directions change together.
- D2: the running total and the budget render on every turn step. That is this
  spec's whole per-step line allowance, so a repeat mark or a skill declaration
  shares that line rather than adding a second.
- D3: a repeat is compared within the turn, and only where the call returned
  what the earlier one returned. A turn can change what a call reads, so
  identical arguments alone would mark the grep that confirmed a write.

D4 and D5 are open and yours to close. Neither blocks.

D4 is the one with teeth: applicable_skills is a per-call argument today, and
the question is whether it moves up to the step. The requirements lean to
promoting only a declared empty list, since that is the claim three defects
turned on, but the design has to say either way what renders and what a reader
concludes from it. One constraint holds whichever you pick: a declared [] and an
omitted argument must not render alike, since the schema makes the argument
required, so an omission is refused where an empty list passes, and the gate
turns on that difference.

D5 may close as nothing, and its entry records why that is a real answer here.

Load the sdd skill and follow references/design-conventions.md. Load
code-generation and its TypeScript reference before naming any class or method.
Two sections of design-conventions.md have no content in this repo and are
dropped rather than filled: this repo has no feature flags and no flag registry,
so there is no rollout flag to preflight and no gating to design. The archived
spec 2026-09-18b-charging-a-batch-of-calls did the same.

Verify these before building on them. All were read on 2026-09-18 in a checkout
that kept moving, and the requirements were corrected once already when an
inherited claim proved wrong.

- TranscriptTurnSection.answered truncates the tail at the last model note on
  every ending but Replied. This is what empties the slice and renders "nothing
  recorded". An earlier session traced the symptom to a history range that
  closeOpenStep never extends; that range is indeed never extended and it does
  not cause the symptom.
- MistralMapper.toChatTurn returns a ChatTurn of calls or of text, never both,
  and toApiMessage hardcodes content to '' on any message carrying tool calls.
- ChatTurn has one production consumer: ConversationTurnRunner.runTurnStep at
  lines 57 to 59.
- StoredMessages.of already persists content for a tool-call message and
  StoredMessages.assistant reads it back only when there are no calls, so the
  restore path is one line and SESSION_SNAPSHOT_VERSION does not move.
- ConversationTurnRunner.spendOn at line 73 is the one place a batch's size
  reaches IterationCounter, and it runs after the calls do.
- Neither toChatTurn nor toApiMessage has a unit test today. The mapper's suite
  covers fileNameFor alone.
- aToolTurn in src/test-support/builders.ts is variadic over calls, so it cannot
  take an optional trailing text. 149 test call sites reach these through it and
  ChatMessage.modelToolCalls, so the builders are the blast radius rather than
  the call sites.

D1 makes this a prompt change and so a behaviour change: the model reads its own
last reply in full on the next step. Say in the design how that is tested against
a real vault and a real key, and check
src/model/prompt/tests/fixtures/release-3-prompt.txt rather than assuming it is
unaffected.

Plan the unit tests against the files that already cover this ground:
src/session/transcript/tests/transcript-document.test.ts for what the document
renders, transcript-repository.test.ts for what a step records,
src/engine/tests/iteration-counter.test.ts for the charge, and
src/model/providers/tests/mistral-mapper.test.ts for the boundary that currently
has no coverage of either direction.

Run bun run test rather than bun run verify. verify runs prettier over the whole
repo and writes main.js at the root, which leaves a diff to unpick from the
design.

If a spec claim turns out wrong, fix the spec and say what you fixed rather than
designing around it.
```
