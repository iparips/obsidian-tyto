---
created: 2026-09-11
updated: 2026-09-11
---

# Tasks: Eval Suite

Build order in five commits, each with an exit test. The order is chosen so the
pass rates are known before any threshold is written down.

## 1. Unit CI

The prerequisite. The repo has no workflows, so nothing currently guards the
unit suite either.

- Add .github/workflows/unit.yml running bun run build on push and pull request.

Exit: a pull request shows a green check that ran the unit suite.

## 2. The runner, on one case

The smallest thing that can run end to end. One case, one assertion family.

- eval.config.ts with the pinned model id and the concurrency limit.
- vitest.eval.config.ts including evals only.
- RecordingProvider, EvalVault, the case type and the loader.
- Assertions for the vault family only: noteEquals, noteContains.
- One editing case, threshold left at 1 of 1 for now.
- bun run eval in package.json.

Exit: bun run eval passes the editing case against a real key, and bun run build
is unchanged in what it runs and how long it takes.

## 3. Trajectory and restraint

The families that catch what the unit suite cannot.

- calls, callsInOrder, exactlyOneOf, maxRoundTrips.
- containsUnderHeading, unchangedRegion, noEdits, onlyTargetWritten.
- Reporter: per-case tally, and the failure block naming the utterance, the
  recorded calls and the final note.

Exit: a case asserting resolve_date precedes glob_notes passes, and fails when
its assertion is inverted.

## 4. Measure, then set thresholds

The step that decides whether the suite is worth keeping. Do not skip it.

- Run each case about ten times. Record the observed rate in the case file.
- Set runs and threshold from the measurement.
- Grow to twelve to fifteen cases across editing, finding, dates, answering.
- Results JSON holding the model id, the commit and each tally.

Exit: two consecutive full runs are green, and every case file carries its
measured rate.

## 5. Eval CI

- .github/workflows/eval.yml on a nightly schedule and on pull requests touching
  src/model/prompt or src/engine/tools/tool-schemas.ts.
- Skip when the key is absent. Publish the tally to the job summary.

Exit: a scheduled run publishes a tally, and a fork pull request skips rather
than fails.

## Starter cases

What the first set covers, so the cases test rules rather than the surface.

| Case                   | Family      | Rule it guards                               |
| ---------------------- | ----------- | -------------------------------------------- |
| add-under-heading      | Vault state | The edit lands in the section named           |
| leaves-other-sections  | Restraint   | An unmentioned section is untouched           |
| date-before-glob       | Trajectory  | resolve_date precedes the glob, never inferred |
| folder-listed-first    | Trajectory  | The first glob ends in a star                 |
| choose-before-open     | Trajectory  | choose_note precedes open_note                |
| one-skill-answer       | Trajectory  | Exactly one of load_skill, no_skill_applies   |
| read-only-question     | Restraint   | A question calls no edit tool                 |
| answer-cites-source    | Answer text | The answer's sources name the note read       |

## Risks

- A threshold set before measuring. Commit 4 exists to prevent it, and skipping
  it is how the suite becomes noise.
- The prompt fixture. A case needing commands or search changes neither the
  prompt nor its fixture, but a case tempting someone to edit a section to make
  it pass would. The fixture wins.
- Rate limits read as regressions. FR14 keeps them a distinct outcome; the
  reporter must not tally a provider error as a model failure.
