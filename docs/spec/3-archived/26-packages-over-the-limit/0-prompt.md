---
created: 2026-09-14
updated: 2026-09-14
---

# Implementation Prompt

Paste the block below into a fresh session to build this spec.

```text
Build the spec in docs/spec/26-packages-over-the-limit: four folders hold more
than the ten files the architecture allows, and each splits without any
behaviour changing.

Read 1-index.md, 2-requirements.md and 3-design.md before starting. 4-tasks.md
gives the build order in five commits; read each commit's section as you reach
it. The suite must stay green at every commit.

Repo conventions are in docs/AGENTS.md, and the package rule it points at is the
code-generation skill's: group by subdomain, and give a subdomain kind folders
only once it outgrows the limit as one thing. Three of these four splits find a
concept; only views splits by kind.

Verify before trusting, since the counts move as the tree changes:
- Recount every folder before you start. The design's arithmetic assumes tools
  16, turn 14, views 17, waiting 3 and the engine root 7.
- The three skill-gating files import each other; ToolDispatcher is their only
  importer beyond that. Confirm nothing else in tools/ names them.
- TurnEndingKind has seven importers, four of them in session. Confirm the list
  before moving it, since that commit touches session without changing it.
- engine/turn has no tests folder: its tests are in engine/tests. Confirm that
  before moving anything, since tools and views do have one.
- iteration-counter, repeated-refusal-counter and turn-spend should have no
  importer outside their own cluster.

Use git mv so the history follows each file. A test moves only where its folder
already sits beside the code; 4-tasks.md says which. No class is renamed and no
behaviour changes: if a split seems to need one, it is the wrong split, so stop
and say so.

src/main.ts imports two of the files views/obsidian takes, so commit 4 fixes an
import outside session.

Commit 5 re-counts the size table in docs/architecture/7-package-design.md and
removes its "over the limit today" line. That line is the reason this spec
exists, so leaving it would be the one thing that makes the work invisible.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it.
```
