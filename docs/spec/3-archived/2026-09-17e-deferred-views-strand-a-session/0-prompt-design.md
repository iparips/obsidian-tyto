---
created: 2026-09-17
updated: 2026-09-17
---

# Design Prompt

Hands the design phase of this spec to a fresh session. Writing the design only,
not building it. Paste the block below, or run new-agent-tab on this file.

```text
Write the design doc for the spec in
docs/spec/2-active/2026-09-17e-deferred-views-strand-a-session. Design only:
write no production code and change nothing under src.

Read 1-index.md, then 2-requirements.md, then 3-decisions.md, then
4-acceptance-criteria.md. Five of the six decisions are resolved and the design
implements them rather than reopening them. D3, whether WorkspaceNoteLocator
stays synchronous, is open and yours to settle in the design.

Load the sdd skill and follow references/design-conventions.md. This repo has no
feature flags and no flag registry, so the Feature flag and Gating sections have
no content here: say so once and drop them rather than inventing a flag. Logging
is console.debug with a [tyto] prefix, so shape that section to what the repo
does. The repo's own conventions are in CLAUDE.md and docs/architecture; read
6-reaching-a-note.md before moving anything in note-binding.

Verify these before trusting them. Each was read on 2026-09-17 and the code may
have moved. WorkspaceNoteLocator.locate is synchronous and has two production
callers, target-note-resolver.ts:38 and target-note-writer.ts:72. OpenNote's
constructor requires a non-null Editor, which is what stops a note with no
editor being a turn's target. TargetNoteWriter.write already falls back to
vault.process when the editor does not hold the note. focusEdit is called once
per turn from turn-ending-service.ts:31 and guards on tabShowsPath.
ResolutionFailed is constructed in one place, target-note-resolver.ts:39, and
acted on in one, turn-runner-factory.ts:75.

Obsidian's loadIfDeferred and isDeferred are the API this turns on. Both are
@since 1.7.2 in node_modules/obsidian/obsidian.d.ts. Read the deferred-views
guide at https://docs.obsidian.md/plugins/guides/defer-views before designing
the leaf search: it warns that loading discards a performance optimisation,
which is why D2 narrows the search rather than sweeping.

The unit suite cannot see any of this, because FakeWorkspace mounts a full view
with an editor on every leaf. Say in the design what that fake needs so the
regression is reachable, and plan the unit tests against it.

Do not run the build to check your work: it reformats the repo and writes
main.js. bun run test is enough.

If the spec is wrong, say so and fix it rather than designing around it. Five
decisions were settled in conversation and one of them may not survive contact
with the code.
```
