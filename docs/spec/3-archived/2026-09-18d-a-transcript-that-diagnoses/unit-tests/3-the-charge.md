---
created: 2026-09-18
updated: 2026-09-18
---

# The Charge

What IterationCounter (Engine Turn Spending) newly exposes, and what a recorded step gains.

## IterationCounter.spent

Today private with this body. The change makes it public, and the cases pin the rounding the budget line depends on.

```text
spent() -> ceil(used)
```

```text
after a single call
  reads one
after a batch of four
  reads three, which is one round-trip and three half-calls rounded up
after two batches of two
  reads three, rather than the four rounding each batch would give
before anything is spent
  reads zero
at the point the turn is exhausted
  reads the budget the exhausted message names
```

## IterationCounter.chargeOfLastSpend

```text
chargeOfLastSpend() -> 1 + (max(calls, 1) - 1) * 0.5, for the most recent spend
```

```text
the last reply batched four calls
  charges two and a half, which is the number the budget line shows
the last reply sent one call
  charges one
the last reply sent no call
  charges one, since a round-trip is still a round-trip
nothing has been spent yet
  charges zero, so a step that never reached the counter reads as uncharged
```

## TranscriptRepository.recordCharge

```text
recordCharge(charge) -> attaches it to the open step
```

```text
a step has been recorded
  attaches the charge to that step
  leaves the earlier steps charges alone
  overwrites nothing when a second charge lands, since one step draws one charge
no step is open
  records nothing rather than throwing, since a charge with no step is a harness defect and not a crash
a step whose provider call failed
  carries no charge, so the document knows not to write a budget line
```
