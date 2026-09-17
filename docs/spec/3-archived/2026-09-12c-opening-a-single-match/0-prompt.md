---
created: 2026-09-12
updated: 2026-09-12
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Build the spec in docs/spec/2026-09-12c-opening-a-single-match: auto mode opens a note
when the search found exactly one, and asks the user when it found several.
Confirm mode does not change.

Read 1-index.md, 2-requirements.md and 3-design.md before starting. 4-tasks.md
gives the build order in two commits. The suite must stay green at each.

Repo conventions are in AGENTS.md: package layout, test placement, and the
repository-scope rule. Read it first.

Verify before trusting, since the spec was written over several sessions:
- NoteChoiceService.automatic has three callers beyond TurnAskersService:
  EngineFactory, TurnRunnerFactory and the test-support builders. Confirm the
  list before replacing it, and that each is a default for a caller with no
  panel to ask.
- EngineFactory passes settings.openMode === 'confirm' as choiceOffered, and
  ToolCatalogue also gates choose_note on search being enabled. Confirm both
  before making the argument constant.
- The system prompt is never given the open mode, which is why no prompt text
  changes and the release 3 fixture stays green. Confirm SystemPrompt takes no
  mode before relying on it.

The end-to-end behaviour is a judgement the suite cannot make. Run the manual
checks at the end of 4-tasks.md in auto mode against a real vault, including the
declined picker, which auto mode could not previously show.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it. Leave finished work in the tree without committing; Ilya chooses the
grouping and the message.
```
