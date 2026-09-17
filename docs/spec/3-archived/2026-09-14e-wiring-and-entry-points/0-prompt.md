---
created: 2026-09-14
updated: 2026-09-14
---

# Implementation Prompt

Paste the block below into a fresh session that will build this spec.

```text
Build the spec in docs/spec/2026-09-14e-wiring-and-entry-points: construction knowledge
moves into a wiring package, and the packages with a single owning service get
an entry point.

Read 1-index.md, 2-requirements.md and 3-design.md before starting. 5-tasks.md
gives the build order in five commits; read each commit's section as you reach
it. The suite must stay green at every commit.

Read 7-plugin-scope before commit 2 and 8-value-types before commit 4. 4-survey
is evidence, 6-cycles is background describing work this spec does not do.

Repo conventions are in AGENTS.md, and the package rule it points at is the
code-generation skill's. The ten-file limit from spec 26 still holds, so recount
any folder you feed.

Verify before trusting, since the tree moves:
- Recount the imports the design rests on. It assumes engine imports session in
  twelve places, two of which construct, and that engine uses four of
  SessionRepository's six methods and three of TranscriptRepository's.
- Confirm turn-runner-factory still defaults a TranscriptRepository, and that
  both its callers pass one explicitly. Commit 2 removes a default only if it is
  genuinely dead.
- Confirm nothing outside engine reads paths-returned-by-vault-repository and
  nothing outside transcript reads loaded-skills, before commit 4 moves them.
- Check whether test-support still constructs across every package boundary.
  The requirements leave its exemption open, so say what you found rather than
  deciding it silently.

Use git mv so the history follows each file. No class is renamed except the
capture package's folder in commit 3, and no behaviour changes: if a move seems
to need one, it is the wrong move, so stop and say so.

Commit 5 corrects the architecture doc's claim that engine depends on session
for nothing. That claim is wrong today, and leaving it is the one thing that
makes the work invisible.

Prettier reformats unrelated files on a build. Keep that reformatting and commit
it separately as a whitespace commit, per AGENTS.md.

If a spec claim turns out wrong, fix the spec and say so rather than building
around it.
```
