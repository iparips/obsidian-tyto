---
created: 2026-09-16
updated: 2026-09-16
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Build the spec in docs/spec/2-active/2026-09-16a-following-the-user-mid-turn. A turn was
redirected to another note halfway through because the user opened it, and a
batch of anchored edits corrupted the note it was archiving. Four commits.

Read 1-index.md, 2-requirements.md and both decisions files first, then
9-tasks.md for the build order. Read 5-design.md and 6-unit-tests.md before
commit 1. 7-analysis.md and 8-transcripts.md are evidence: read them only if a
defect stops making sense. 4-acceptance-criteria.md holds the checks afterwards.

Repo conventions are in AGENTS.md, including the rule that a prompt change
is a behaviour change. Commit 4 is one, so it cannot be judged from the tests.

Verify three claims before trusting them. ConversationTurnRunner.retargetTo is
said to have EditEngine as its only caller, which decides whether commit 1 can
delete it outright. ToolDispatcher is said to retarget through the turn
repository directly, on a different route from the one commit 1 removes, which
is what keeps archived specs 31 and 32 working. And TurnRepository is said to
build NotesChosenByUserRepository in its constructor while the session hands in
the other two, which is the scope split commit 3 copies and the design gets
wrong if you read it as all three being alike.

Two things the unit suite cannot judge, both needing a real key and a vault.
After commit 2 and 3, ask for a todo list to be archived and watch which tool
the model reaches for: the panel should show one write, not one edit per
heading. Duplicated items mean it is still batching, and the fix is the prompt
in commit 4 rather than the boundary. Then type into a note while a turn is
thinking, and confirm the write is refused rather than landing over your typing.

Do not reformat 8-transcripts.md. It is copied verbatim from the panel and
.prettierignore exempts it, because reformatting the JSON changes what the
record says the model sent.

If the spec is wrong, fix the spec and say what changed. Do not build around it.
```
