---
created: 2026-09-12
updated: 2026-09-12
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Build the spec in docs/spec/24-remembering-skills-read: a session-scoped record
of which skills the model has read, an applicable_skills argument on every
guarded tool call, and a reply rule that names what the user can do next.

Read 1-index.md, 2-requirements.md and 3-design.md before starting, and
2a-refusal-replies.md before commit 5. 4-tasks.md gives the build order; read
each commit's section as you reach it. The suite must stay green at every
commit.

Repo conventions are in docs/AGENTS.md: package layout, the repository-scope
rule, test placement, and what a prompt change obliges. Read it first. Its
"Prompt Changes Are Behaviour Changes" section governs commit 5.

Verify before trusting, since the spec was written over several sessions:
- ToolCall.requiresVaultAccess covers four tools, not the edit tools. The design
  names the guarded set explicitly; check it still matches.
- ToolCall.stringsArgument returns [] for an absent array, which is why the
  design reads raw args to tell an omitted argument from a declared [].
- ToolCatalogue.forCapabilities already takes skillsExist; confirm the signature
  before threading anything new through it.
- TurnRepository's constructor takes defaults, so a new parameter should not
  break existing callers. Confirm that holds.

Commit 5 re-records src/model/prompt/tests/fixtures/release-3-prompt.txt. That
is deliberate, not a test to work around: the model is being told something new.
Confirm the fixture's other lines are unchanged.

The end-to-end behaviour is a model outcome the suite cannot assert. Run the
manual checks at the end of 4-tasks.md against a real vault and API key.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it. Leave finished work in the tree without committing; Ilya chooses the
grouping and the message.
```
