---
created: 2026-09-18
updated: 2026-09-18
---

# Tasks

Two commits were planned and one landed. Commit 1 is the rule and its tests. Commit 2 was the prompt line, which the design's rollout deferred until a real vault said whether the refusal alone carried the behaviour. It did, so commit 2 was dropped.

That order was not a convenience. The refusal is the fix and the prompt line is tuning, so landing the line first would have made it impossible to tell which one changed the model's behaviour. Deferring it is what let the acceptance run answer the question.

## Commit 1: a step's target holds still

The guard in ToolCallExecutor.executeToolCalls (Engine Turn), beside the existing single-edit guard.

- Read SessionRepository.targetNote (Session) once before the loop, into a local holding the step's own target
- Refuse a call when that path differs from the session's current one, ahead of the isSecondEditIn check, so a second edit after a move takes the move's refusal and its clearer reason
- Publish the refusal through ProgressLine.refused (Engine) and append it as the tool result, the way refuseSecondEdit does
- Do not record it against RepeatedRefusalCounter (Engine Turn Spending), for the reason the comment above refuseSecondEdit already gives: a batch of three produces the same refusal twice
- Never reassign that local inside the loop. Updating it after a call would leave the next comparison reading the target where the move had just put it, so the guard would refuse nothing
- Name both paths in the refusal text, per the design's wording

The refusal constant sits beside SECOND_EDIT_REFUSAL at the top of the file.

Tests per [6-unit-tests.md](6-unit-tests.md), across three existing files. The harness file needs one more registered command and one more note in the locator for the two-commands case; nothing else needs new wiring, and no new fake.

The unresolvable-retarget case is the one to write first. It fails if the guard reads TurnRepository.targetNote (Engine Turn) instead of the session's, which is the one way this commit can be built wrong and still pass everything else.

Green on its own: no caller changes, and the four existing single-edit tests keep passing unchanged.

## Commit 2: the prompt line [dropped]

Not built. The acceptance run on 2026-09-18 showed the model already reaching one note and editing it before reaching the next, so the condition the rollout set for this commit was not met.

The line would have told the model to interleave. It does that unprompted, and the guard that would have corrected it never fired across three notes. A prompt line earns its place by saving a wasted step, and the run produced none to save.

Revisit only if a later model batches its opens. The wording and its home in ModelsRole.widenedReach (Model Prompt System-Prompt-Sections) are settled in [5-design-stable-step-target.md](5-design-stable-step-target.md), so the work is one line and a fixture check rather than a new design.

## Verifying

`bun run test` for the suite. `bun run verify` before the final commit, which reformats the repo with prettier: keep that reformatting and commit it separately, per CLAUDE.md.

The manual checks are in [4-acceptance-criteria.md](4-acceptance-criteria.md), and they ran on 2026-09-18. All five pass, and the three-note baseline is recorded there.
