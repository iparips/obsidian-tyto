---
created: 2026-09-18
updated: 2026-09-18
---

# Tasks

Two commits, and the second may not land. Commit 1 is the rule and its tests. Commit 2 is the prompt line, which the design's rollout defers until a real vault says whether the refusal alone carries the behaviour.

That order is not a convenience. The refusal is the fix and the prompt line is tuning, so landing the line first would make it impossible to tell which one changed the model's behaviour.

## Commit 1: a step's target holds still

The guard in ToolCallExecutor.executeToolCalls (Engine Turn), beside the existing single-edit guard.

- Read SessionRepository.targetNote (Session) before the loop, into a local holding the path as it stood after the last call
- Refuse a call when that path differs from the session's current one, ahead of the isSecondEditIn check, so a second edit after a move takes the move's refusal and its clearer reason
- Publish the refusal through ProgressLine.refused (Engine) and append it as the tool result, the way refuseSecondEdit does
- Do not record it against RepeatedRefusalCounter (Engine Turn Spending), for the reason the comment above refuseSecondEdit already gives: a batch of three produces the same refusal twice
- Re-read the session's path after every call, including a refused one, so the comparison cannot go stale
- Name both paths in the refusal text, per the design's wording

The refusal constant sits beside SECOND_EDIT_REFUSAL at the top of the file.

Tests per [6-unit-tests.md](6-unit-tests.md), across three existing files. The harness file needs one more registered command and one more note in the locator for the two-commands case; nothing else needs new wiring, and no new fake.

The unresolvable-retarget case is the one to write first. It fails if the guard reads TurnRepository.targetNote (Engine Turn) instead of the session's, which is the one way this commit can be built wrong and still pass everything else.

Green on its own: no caller changes, and the four existing single-edit tests keep passing unchanged.

## Commit 2: the prompt line [deferred]

Only after the acceptance checks in [4-acceptance-criteria.md](4-acceptance-criteria.md) run against a real vault and show the model still batching its opens.

One line in ModelsRole.widenedReach (Model Prompt System-Prompt-Sections), telling the model to reach one note and edit it before reaching the next. Not the always-stated block: a vault with no commands and no search cannot retarget, and that is the prompt the release 3 fixture guards.

Check the fixture is still green rather than assuming it. If the line lands outside widenedReach, re-record src/model/prompt/tests/fixtures/release-3-prompt.txt deliberately and say so in the commit message, per CLAUDE.md.

The wording needs a real vault and a real API key to judge. The suite cannot tell a line that changes the model's planning from one it ignores.

## Verifying

`bun run test` for the suite. `bun run verify` before the final commit, which reformats the repo with prettier: keep that reformatting and commit it separately, per CLAUDE.md.

The manual checks are in [4-acceptance-criteria.md](4-acceptance-criteria.md). They are what decides whether commit 2 happens at all.
