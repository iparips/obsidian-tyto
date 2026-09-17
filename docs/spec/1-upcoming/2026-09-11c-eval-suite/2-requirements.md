---
created: 2026-09-11
updated: 2026-09-11
---

# Requirements: Eval Suite

Catch a regression in the model's judgement, which the unit suite cannot see.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [What an eval asserts](#what-an-eval-asserts)
6. [Requirements](#requirements)
7. [Non-functional requirements](#non-functional-requirements)
8. [What the design must settle](#what-the-design-must-settle)

## Problem

The repo already says it: a prompt change is a behaviour change, and the unit
tests cannot catch a regression in judgement. The instruction is to test a prompt
change against a real vault and a real API key, by hand.

That hand test is the gap. It runs when someone remembers, on whichever vault
they happen to have open, and its result lives in one person's terminal. Nothing
records what passed, so nothing notices when it stops passing.

What can regress is mostly not an edit. Fourteen tools reach the model and three
of them write. The rest route: resolve a date, list a folder, offer a shortlist,
load a skill. The tool descriptions spend most of their words on ordering and
exclusivity rules, and none of those rules shows up in a note's final content.

One example fixes the shape. The resolve_date description says never work the
date out yourself. A prompt edit that loses that rule leaves the note correct on
the day it runs and wrong three weeks later, and every existing test stays green.

The seam needed to test this already exists. The builder anEngine takes any
ChatProvider, so the same wiring the unit tests use runs against the real
provider with no plugin change.

## Goals

- Assert what the model chose, not only what the note ended up saying, so an
  ordering rule is guarded by something.
- Run the same engine the plugin runs, so a pass means the real path works.
- Keep cases as data, so adding one needs no TypeScript.
- Report a pass rate per case, since one failure of a sampled behaviour is not a
  regression.
- Run in CI on a schedule and on a prompt change, and never on every push.
- Stay out of the unit suite, so the build stays offline and free.

## Non-goals

- Replacing the unit suite. Deterministic behaviour stays where it is tested now.
- Gating every pull request. The suite costs money and minutes, and it flakes.
- Driving Obsidian. The fakes hold the vault; no app process is launched.
- Testing transcription. Audio in, text out is a separate provider and a separate
  kind of fixture.
- Judging prose quality by default. A judge is a later option for one case
  family, not the assertion style of the suite.
- Comparing models or tuning a model choice. The suite watches one pinned model
  for drift in our prompt.

## User stories

- As the author of a prompt change, I run one command and read a pass rate per
  case, so I can tell whether my edit cost the model a rule.
- As the author of a prompt change, a pull request touching the prompt tells me
  the eval result before I merge it.
- As a maintainer, a nightly run records which cases passed against a pinned
  model, so drift in the model shows up as a dated change rather than a surprise.
- As a maintainer, I add a case by writing one data file, without reading the
  runner.
- As a maintainer, a case that fails names the utterance, the tool calls the
  model made, and the note as it ended, so the failure is readable without a
  rerun.
- As a contributor from a fork, my pull request does not fail because it cannot
  read an API key.

## What an eval asserts

Four surfaces are observable after a turn, and each supports its own family of
assertion. The families are ranked by how much regression they catch.

| Family      | Reads from          | Catches                          | Deterministic |
| ----------- | ------------------- | -------------------------------- | ------------- |
| Trajectory  | Recorded tool calls | Wrong route, skipped step, loops | Yes           |
| Vault state | The fake editor     | Wrong or malformed edit          | Yes           |
| Restraint   | Absence of calls    | Unasked edits, wrong note        | Yes           |
| Answer text | answer_from_search  | Wrong facts in a read-only reply | No            |

Trajectory leads because the rules most at risk are ordering rules. Restraint is
its own family rather than a vault assertion, because a model that does what was
asked plus something extra passes a naive contains check.

Answer text is the only family that cannot be settled by a predicate, and even
there a predicate comes first: the figure from the fixture note appears, and
sources names the right path.

## Requirements

### Running a case

FR1. Build the engine the way EngineFactory builds it, with the real provider in
place of the mocked one, so a pass exercises the shipped path.

FR2. Hold the vault in memory, built from the case file, so a run needs no vault
on disk and no Obsidian process.

FR3. Record every tool call the model returns, in order, across all round-trips
of the turn, so an ordering assertion has something to read.

FR4. Run a case a stated number of times and report how many passed, since a
single run of a sampled behaviour decides nothing.

FR5. Pass a case when its passes reach its stated threshold, and fail it
otherwise.

FR6. Pin the model id in the suite's own configuration, and record it with the
results, so a red run distinguishes our change from the model moving.

### Writing a case

FR7. Read a case from one data file holding the vault, the target note, the
utterance, the assertions, the run count and the threshold.

FR8. Support trajectory assertions over the recorded calls: that a tool was
called, that one call preceded another, that exactly one of a pair was called,
and that the round-trip count stayed under a cap.

FR9. Support vault assertions over the target note's final content: equality,
contains, contains under a named heading, and that a named region is unchanged.

FR10. Support restraint assertions: that no edit tool was called, and that no
note beyond the target was written.

FR11. Assert nothing about the model's prose. A case may assert a fact inside an
answer, never its wording.

### Reporting

FR12. Name, for every failing case, the utterance, the recorded tool calls, and
the final note content, so a failure is diagnosable without rerunning it.

FR13. Write the run's results as a machine-readable file as well as to the
console, so a scheduled run can be kept and compared.

FR14. Report a case whose provider call failed as an error distinct from a case
the model got wrong, since a rate limit is not a regression.

### Running in CI

FR15. Run the full suite on a schedule, and publish the result where it is read
without opening a log.

FR16. Run the suite on a pull request that changes the prompt or the tool
schemas, since that is the change the suite exists to guard.

FR17. Skip rather than fail when no API key is available, so a fork's pull
request is not blocked by a secret it cannot read.

FR18. Never run on every push, and never inside the unit suite's command.

## Non-functional requirements

NFR1. The unit suite stays offline, free and unchanged in duration. The eval
suite is a separate command with its own configuration.

NFR2. No case holds an API key, and no result file records one.

NFR3. A case's fixture vault is small enough to read in the case file itself, so
the input to a failure is visible beside the assertion.

NFR4. A full run finishes inside the time a nightly job tolerates, with cases
running concurrently where the provider's rate limit allows.

NFR5. Adding a case changes one data file and no source file.

## What the design must settle

- Where the recorded calls come from: a decorator around the provider, versus
  reading the chat history the session already keeps.
- Whether the runner is hosted by Vitest with its own configuration, or is a
  standalone script.
- The case file's format and the vocabulary its assertion keys use.
- How a threshold is chosen, given a case's true pass rate is unknown until it
  has been run enough times to measure.
- Which starter cases go in, and which tool rules they cover between them.
- How concurrency is bounded against the provider's rate limit.
