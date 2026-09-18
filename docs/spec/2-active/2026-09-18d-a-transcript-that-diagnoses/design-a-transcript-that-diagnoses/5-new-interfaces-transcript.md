---
created: 2026-09-18
updated: 2026-09-18
---

# New Interfaces: The Charge And The Transcript

The signatures commits three to five build. The model side is [4-new-interfaces.md](4-new-interfaces.md).

## IterationCounter (Engine Turn Spending)

src/engine/turn/spending/iteration-counter.ts. The counter already holds the fraction and the max, and exposes neither the running total nor what one spend drew.

```ts
export class IterationCounter {
  // The rounded running total, read as isSpent reads it, so the last step's
  // number is the one the exhausted message names.
  spent(): number

  // What the most recent spend charged, carrying the half a batch draws.
  chargeOfLastSpend(): number
}
```

spent is today a private method with exactly this body, and the change makes it public.

## RecordedTurnStep and StepCharge (Session Transcript)

src/session/transcript/models/transcript-record.ts. StepCharge (Session Transcript, new) is a value object, so the three numbers cannot be recorded apart and disagree.

```ts
export class RecordedTurnStep {
  constructor(
    readonly turn: number,
    readonly step: number,
    readonly parts: readonly TranscriptPart[],
    readonly history: StepRange,
    readonly progressLines: StepRange,
    // Null until the step is charged: a step whose provider call failed never
    // reaches the counter.
    readonly charge: StepCharge | null = null,
  )

  withProgressLines(progressLines: StepRange): RecordedTurnStep
  withCharge(charge: StepCharge): RecordedTurnStep
}

export class StepCharge {
  constructor(
    readonly charged: number,
    readonly usedAfter: number,
    readonly budget: number,
  )
}
```

## TranscriptRepository (Session Transcript)

src/session/transcript/transcript-repository.ts, one added method.

```ts
export class TranscriptRepository {
  // Called from ConversationTurnRunner.spendOn, after the calls have run and
  // the counter has taken them. The open step is the one that sent them.
  recordCharge(charge: StepCharge): void
}
```

## RepeatedCalls and CallsOfStep (Session Transcript, new)

src/session/transcript/repeated-calls.ts. A repository by this repo's own test, since it holds a map across calls and answers questions about it. Turn-scoped rather than session-scoped, per D3, so it is built per turn section rather than held by the document.

```ts
// A call repeats an earlier one of the same turn when its name, its arguments
// and the result it returned all match. The result is part of the test because
// a turn can change what a call reads.
export class RepeatedCalls {
  // Walked once over the turn's steps in order, so the first occurrence is
  // never marked and every later one names the step it repeats.
  static of(steps: readonly CallsOfStep[]): RepeatedCalls

  // The step a call repeats, or null where it is the first of its kind.
  repeatedStepOf(call: ToolCall): number | null
}

// One step's calls paired with what each returned, which is what the
// same-result test needs and what the history holds either side of the
// step boundary.
export class CallsOfStep {
  constructor(
    readonly step: number,
    readonly calls: readonly ToolCall[],
    readonly resultsByCallId: ReadonlyMap<string, string>,
  )
}
```

Pairing a result to its call is by id. ToolCallExecutor (Engine Turn) appends every result as a ChatMessage.toolCallResult carrying the call's id, so the test is computable at export time and nothing new is recorded.

## TranscriptTurnStep (Session Transcript)

src/session/transcript/transcript-turn-step.ts, one added parameter.

```ts
export class TranscriptTurnStep {
  static write(
    step: RecordedTurnStep,
    history: TurnStepHistory,
    progressLines: readonly ProgressLine[],
    ending: RecordedEnding | null,
    skills: LoadedSkills,
    repeats: RepeatedCalls,
  ): string[]
}
```
