---
created: 2026-09-17
updated: 2026-09-18
---

# Multi-Note Editing: Spec

One utterance naming a shopping list, a todo and today's daily note writes to none of them. Found on mistral-medium-latest against a real vault, with two transcripts: the first ran out of steps, the second ended stuck after the two smaller faults were fixed.

The loop can already edit several notes in a turn: reach a note, edit it, reach the next. What is missing is the guarantee that a step's target holds still. The note is read once at the start of a step, but a command or an open moves the target mid-step. Three notes opened in one step therefore leave every edit anchored to whichever opened last.

The work is one rule: refuse a second retargeting call in a step, as a second edit is already refused. A prompt line asking the model to reach one note before the next was planned beside it as tuning, and the acceptance run showed it was not needed.

- [0-prompt.md](0-prompt.md) - hands the build to a fresh session: reading order, what to verify, and the check a person has to make
- [0-prompt-design.md](0-prompt-design.md) - hands the design phase to a fresh session. Spent; kept as the record of what the design was asked for
- [2-requirements.md](2-requirements.md) - the once-per-step read, the two tools that move the target, and steps to replicate
- [3-decisions.md](3-decisions.md) - why the rule covers every retargeting call, why a step cannot both reach and edit, and what the fix assumes about the model
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - five manual checks, since whether the model interleaves is a judgement no unit test makes, and the three-note baseline they produced
- [5-design-stable-step-target.md](5-design-stable-step-target.md) - where the guard sits, which target it compares, and why the two rules read unlike
- [6-unit-tests.md](6-unit-tests.md) - the cases, and which of the three existing test files each lands in
- [7-tasks.md](7-tasks.md) - the commit that landed, and why the prompt line was dropped rather than deferred
- [meta/1-index.md](meta/1-index.md) - what the design phase read, what each source changed, and what it cost

Every decision is resolved. D5 settles which target the guard reads, which is the one place the design could have been built wrong without a test catching it.

## What shipped

The guard alone. ToolCallExecutor.executeToolCalls (Engine Turn) reads the session's target once before the loop and refuses any call that follows a move, ahead of the existing single-edit check. Twenty tests across three files, and the suite went from 1400 to 1420.

The prompt line was dropped. The acceptance run on 2026-09-18 wrote all three notes in fifteen steps, six of them excluding skill gating, and the new guard never fired: the model interleaved its opens and edits without being told to. The line saves a wasted step, and there was none to save.

One correction to the spec came out of the build. The unit-test pseudocode re-read the target into the same local after every call, which makes the guard dead, because the first move updates the local and the next comparison finds nothing changed. The comparison is against the step's own target, read once and never reassigned. Fixed in [5-design-stable-step-target.md](5-design-stable-step-target.md), [6-unit-tests.md](6-unit-tests.md) and [7-tasks.md](7-tasks.md).

On main already: 79e505c says an empty note read back empty, a777c0b names the anchor and the note an edit failed on. Neither is the cause, and the second transcript fails with both in place.
