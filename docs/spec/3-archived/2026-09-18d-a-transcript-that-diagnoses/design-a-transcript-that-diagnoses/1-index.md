---
created: 2026-09-18
updated: 2026-09-18
---

# A Transcript That Diagnoses: Design

Make the transcript say three things it currently gets wrong or leaves out: the model's reply when it carried text alongside tool calls, what a step spent of the turn's budget, and which calls a turn repeated verbatim. Two of the six requirements close as no change, because the record already carries what they asked for.

- [2-what-changes.md](2-what-changes.md) - which requirements need code and which close as no change, and the behaviour table
- [3-behaviour-sequence.md](3-behaviour-sequence.md) - the two paths the change touches, as one sequence diagram
- [4-new-interfaces.md](4-new-interfaces.md) - the signatures on the model side, which commits one and two build
- [5-new-interfaces-transcript.md](5-new-interfaces-transcript.md) - the signatures commits three to five build
- [6-the-three-renderings.md](6-the-three-renderings.md) - what the budget line, an empty response block and a repeat mark look like
- [7-testing-and-rollout.md](7-testing-and-rollout.md) - how the prompt change is tested against a real vault, what is out of scope, and the build order

The unit test plan is [../unit-tests/1-index.md](../unit-tests/1-index.md). No feature flag: this repo has no flag registry, so the rollout-flag and gating sections are dropped rather than filled.
