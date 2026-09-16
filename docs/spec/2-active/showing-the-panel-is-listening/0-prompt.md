---
created: 2026-09-16
updated: 2026-09-16
---

# Prompt

Paste the block below into a fresh session.

```text
Show that the panel is listening, specified in
docs/spec/2-active/showing-the-panel-is-listening.

Read 1-index.md, 2-requirements.md, 5-tasks.md, then 3-design.md before commit
1. 4-decisions.md holds the iOS assumption that shapes commit 2; read it before
writing the hook.

Load the code-generation and code-unit-tests skills before the first commit.
Repo conventions are in docs/AGENTS.md; read it first.

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

Do not attempt to verify the feature on a device. Say in the PR body that the
bars following a voice needs checking on desktop, Android and iOS, and that a
meter frozen at rest on iOS alone means the AudioContext was suspended rather
than the microphone being dead.

If the spec is wrong, say so and fix the spec. Do not build around it.
```
