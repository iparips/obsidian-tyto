---
created: 2026-09-18
updated: 2026-09-18
---

# Design Prompt

Hands the design phase of this spec to a fresh session. Writing the design only, not building it. Paste the block below, or run new-agent-tab on this file.

```text
Write the design doc for the spec in
docs/spec/2-active/2026-09-17f-multi-note-editing. Design only: write no
production code and change nothing under src. Work on main, in this checkout.

Read 1-index.md, then 2-requirements.md, then 3-decisions.md, then
4-acceptance-criteria.md. D1, D2 and D4 are resolved and the design implements
them rather than reopening them. D3, whether a refused retarget spends a step
against IterationCounter, is open and yours to settle in the design.

The whole change is one rule: within a turn step, a tool call that follows an
actual change of target is refused. It mirrors the single-edit rule already in
ToolCallExecutor, and per D4 it counts the target moving rather than the call
that might have moved it.

Load the sdd skill and follow references/design-conventions.md. This repo has no
feature flags and no flag registry, so the Feature flag and Gating sections have
no content: say so once and drop them rather than inventing a flag. The repo's
conventions are in CLAUDE.md and docs/architecture; read 6-reaching-a-note.md
before moving anything that touches the target, and 2-vocabulary.md before
naming anything, since turn, turn step and retarget are easy to confuse.

Verify these before trusting them. Each was read on 2026-09-18 and the code may
have moved. ToolCallExecutor.executeToolCalls loops the calls of one step and is
called from conversation-turn-runner.ts:63. isSecondEditIn reads a ToolCall
before dispatch, and refuseSecondEdit deliberately does not record against
RepeatedRefusalCounter, which the comment above it explains. Both run_command
and open_note reach ToolDispatcher.moveSessionTargetNoteTo at line 308.
turnRepository.targetNote() returns the current target and is readable between
calls. ModelService.targetNoteDetails performs the once-per-step read the whole
rule rests on.

D4 is the decision with teeth. Counting the move means the guard cannot read a
ToolCall before dispatch the way isSecondEditIn does, so it observes the target
around each call instead. Say in the design where that leaves the two rules:
whether they stay one loop with two guards, or the edit rule moves to match.

The prompt text is in scope but secondary. models-role.ts:19 holds the existing
one-edit rule and the new line sits beside it. Editing it re-records
src/model/prompt/tests/fixtures/release-3-prompt.txt, which CLAUDE.md calls the
guard on prompt drift: re-record it deliberately rather than working around it,
and note in the design that the wording needs a real vault and key to judge.

Plan the unit tests against the existing ones in
src/engine/tests/edit-engine.test.ts, which already cover the single-edit rule
including the three-edit batch that must not end the turn. The new rule needs
the matching cases, plus one for a command that opened nothing, which per D4
does not consume the step.

Do not run the build to check your work: it reformats the repo and writes
main.js. bun run test is enough.

If the spec is wrong, say so and fix it rather than designing around it. Three
decisions were settled in conversation and D4 in particular may not survive
contact with the executor's structure.
```
