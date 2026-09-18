---
created: 2026-09-18
updated: 2026-09-18
---

# Charging A Batch Of Calls: Requirements

## Why

A turn's allowance is twenty tool calls, spent one per call however the calls arrive. A model that sends four greps in one reply is charged four, the same as a model that sends them across four replies.

The two are not the same. Four calls in one reply cost one model round-trip; four replies cost four. The batch is the cheaper shape in every way that matters to the user, and the counter charges it as though it were the expensive one.

A real turn hit this. Asked for themes across three weeks of tagged notes, the model batched its searches, reached the right notes in eleven round-trips, and ran out of allowance on the step that would have read them. It had spent exactly twenty calls, because six of those steps sent two to four calls each.

The tool schemas invite batching and nothing warns against it. A turn that batches well is punished for it.

## In Scope

- What one tool call costs when it arrives in a batch with others.
- The warning threshold, which is read off the same allowance.
- The message a turn ends with when the allowance runs out, which names the allowance.

## Out Of Scope

- The size of the allowance. Twenty stays twenty; this changes what a call draws against it, not how much there is.
- Any cap on how many calls one reply may carry. The provider decides that.
- The repeated-call loop, where a model sends the same call several times over. A cheaper batch makes that loop cheaper too, which is the wrong direction, and it is its own spec.
- Charging by what a call costs the vault. A grep over the whole vault and a glob of one folder are not the same work, and nothing here tries to price that.

## Scenarios

### A batch costs less per call than the same calls sent one at a time

**Given** a turn has spent nothing of its allowance
**When** the model sends one reply carrying four tool calls
**Then** the turn has spent less than four, and more than one

### A single call costs what it costs today

**Given** a turn has spent nothing of its allowance
**When** the model sends one reply carrying one tool call
**Then** the turn has spent one

### A reply carrying no calls still costs

**Given** a turn has spent nothing of its allowance
**When** the model replies with text and no tool calls
**Then** the turn has spent one, since the round-trip happened

### The turn that ran out now finishes

**Given** the twenty-call turn from Why, replayed call for call
**When** the last batch of four greps returns
**Then** the turn has allowance left to read the notes and answer

### Running low is still warned about

**Given** a turn whose remaining allowance crosses the warning threshold inside a batch
**When** that batch is charged
**Then** the panel gains one warning line, and only one

## References

- [3-decisions.md](3-decisions.md) - what a batch costs and why that curve
- `src/engine/turn/spending/iteration-counter.ts` - the allowance, the warning threshold, and `spend(calls)`
- `src/engine/turn/conversation-turn-runner.ts:73` - `spendOn`, the one place a batch's size reaches the counter
- `src/engine/turn/spending/turn-spend.ts` - what a turn spends, and what asks whether it is exhausted
