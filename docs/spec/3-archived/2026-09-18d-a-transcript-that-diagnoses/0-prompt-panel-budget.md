---
created: 2026-09-18
updated: 2026-09-18
---

# Prompt: The Panel's Step Count Against the Budget

Hands one addition to the session building this spec, because its D2 already
carries the budget through a recorded step and the panel is a second reader of
the same value. Paste the block below.

```text
Add the turn's budget to the panel's progress summary, in the session already
building docs/spec/2-active/2026-09-18d-a-transcript-that-diagnoses.

Ilya reported a panel showing 22 numbered rows against a budget he set to 20.
Your D2 fixed this for the transcript; the panel never got the same treatment.

Read first:
- 3-decisions.md in that folder, D2, for where the numbers come from.
- src/session/views/EntryProgress.tsx: summaryOf renders "22 steps" from
  lines.length, and is the only place the panel states a count.
- docs/architecture/2-vocabulary.md, the concept table. It gives a panel row the
  word progress line and names "step" as the wrong word for one. summaryOf uses
  the wrong word, which is the root of the confusion as much as the count is.
- docs/spec/3-archived/2026-09-18b-charging-a-batch-of-calls, for why a call
  after the first costs half. Do not change that arithmetic: charging one per
  call killed a real turn, and reverting it reintroduces the failure.

Decide and record in 3-decisions.md: whether the summary names the spend or the
row count stays the headline with the spend beside it, and whether a turn under
way shows a running total. D2 chose the running total for the transcript; the
panel is a different reader and may want otherwise.

Verify rather than trust: IterationCounter (Engine Turn Spending) exposed
neither the running total nor one step's charge when D2 was written, and your
commit dc4aeab adding both is not on main as of 594997b. Check what your tree
exposes, and how engine state reaches the panel, before adding a prop.

The end-to-end check is a judgement the suite cannot make: run a question that
makes the model batch its searches, then confirm a reader can tell what the turn
spent without counting rows or knowing a batched call costs half.

Conventions are in CLAUDE.md and docs/architecture/1-overview.md. If the spec is
wrong, say so and fix it rather than working around it.
```
