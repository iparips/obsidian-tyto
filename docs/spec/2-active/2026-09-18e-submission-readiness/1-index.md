---
created: 2026-09-18
updated: 2026-09-18
---

# Submission Readiness: Spec

Closes the gap between a plugin that passes the community directory's gate and a plugin that is listed. The community-plugin-submission spec built the compliance; this one finds what has drifted since, fixes it, and runs the submission.

The re-audit found the gate itself green. Lint reports nothing, typecheck passes, 1504 tests pass, and the bundle builds clean with no sourcemap and no rewritten source. What is missing is smaller than the earlier spec's work and mostly not code: two debug lines that returned, a repo page with no description, and a release that was never cut.

- [2-requirements.md](2-requirements.md) - what drifted, what is missing, and what the earlier spec already cleared
- [3-decisions.md](3-decisions.md) - one open decision, on making the licence detectable, and the assumptions the work rests on
- [4-acceptance-criteria.md](4-acceptance-criteria.md) - the four checks a person runs, ending at the scan result
- [5-tasks.md](5-tasks.md) - two commits, then the hand-run submission sequence

## What the Re-audit Confirmed

Worth stating, because it is most of the earlier spec and none of it needs revisiting.

- The rename landed: the manifest id is tyto, and the settings migration carries an Owl-era install across.
- The settings tab implements getSettingDefinitions, so the rule that flagged it is quiet.
- minAppVersion is 1.13.0, mapped in versions.json, which clears the two API-version bugs the earlier audit found late.
- The build workflow runs typecheck, test, lint and build on every push and pull request, and attests three assets on a created release.
- LICENSE.md carries Ilya's copyright above the AGPL text, and package.json declares AGPL-3.0-or-later.
- main.js, main.js.map and data.json are all untracked and named in .gitignore, so the API key never entered history.

## The One Thing That Regressed

Two console.debug calls came back in WorkspaceNoteLocator (engine/note-binding), arriving with the deferred-views work after the submission spec closed. The linter does not catch a console call, so the earlier spec's exit test - run a turn and see nothing printed - is the only thing that would have. That test is now an acceptance criterion rather than a one-off, which is the difference worth carrying forward.
