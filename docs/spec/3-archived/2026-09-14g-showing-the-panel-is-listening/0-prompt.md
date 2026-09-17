---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Show that the panel is listening, specified in
docs/spec/3-archived/2026-09-14g-showing-the-panel-is-listening.

Read 1-index.md, 2-requirements.md and 6-tasks.md, then 3-design.md before the
first commit. 5-tests.md holds the checks a person runs afterwards. 4-decisions.md
carries the iOS assumption that shapes commit 2; read it before writing the hook.

Load the code-generation and code-unit-tests skills first. Repo conventions are
in AGENTS.md.

All three commits are in scope.

Verify before trusting:
- Recorder holds its MediaRecorder privately. Confirm MediaRecorder.stream is
  reachable, since commit 1 rests on it.
- Four test fakes implement RecorderPort. Confirm the count before widening it,
  since a missed one fails the build rather than the suite.
- PendingEntry returns null for the recording phase today. Confirm it, since
  commit 3 puts the strip beside it rather than inside it.

happy-dom has no real AudioContext, so the suite cannot judge the meter. Drive a
fake analyser and test the lifecycle: no context while idle, closed when the
stream goes, at rest under reduced motion. Do not try to assert amplitudes.

Do not attempt to verify the feature on a device. Say in the PR body that
5-tests.md names the device checks, and which platforms they run on.

If the spec is wrong, say so and fix the spec. Do not build around it.
```
