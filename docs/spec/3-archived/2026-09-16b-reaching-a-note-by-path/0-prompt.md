---
created: 2026-09-16
updated: 2026-09-16
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

Spent: the four commits below are built and committed. The one bullet it left
was built from [0-prompt-2.md](0-prompt-2.md), which is spent too.

```text
Build the spec in docs/spec/3-archived/2026-09-16b-reaching-a-note-by-path. The plugin reaches
a note through an editor, and an editor belongs to a tab rather than a file, so
a write follows the tab and lands in a note nobody named. Four commits.

Read 1-index.md and 2-rules.md first: every decision cites a rule, and the rules
are short. Then 3-requirements.md and both decisions files, then 8-tasks.md for
the build order. Read 5-design.md and 6-unit-tests.md before commit 1.
9-transcript.md is evidence, read only if a defect stops making sense.
7-acceptance-criteria.md holds the checks afterwards.

Repo conventions are in AGENTS.md. Commits 1 and 2 are the fault and ship
without 3 and 4, which matters: the wrong-note write is live, so do not hold
them behind the panel work.

Verify three claims before trusting them. Vault.process is said to read, modify
and save one file atomically; confirm the signature, since commit 1 rests on it.
PanelReducer is said to find a turn's steps by scanning back to the last user
entry, which commit 3 replaces with a container. And SESSION_SNAPSHOT_VERSION is
said to discard a mismatched record rather than migrate it, which is what makes
the shape change safe to ship.

One thing the spec cannot tell you, and it is worth five minutes before commit
1: whether a Vault.process write lands in the editor's undo stack when the note
is open. Write that way to an open note and undo in the editor. The answer does not
change what to build, only whether the vault branch is worth announcing in the
panel. Say what you found.

Two checks need a real vault and a moving tab, so you cannot run them. Say so
rather than claiming them.

If the spec is wrong, fix the spec and say what changed. Do not build around it.
```
