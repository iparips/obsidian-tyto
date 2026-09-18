---
created: 2026-09-18
updated: 2026-09-18
---

# Ending On An Answer: New Interfaces

Every type and method the change introduces, and the four signatures it changes.

## New interfaces

src/engine/tool-call-outcome.ts, the sixth field and the factory that sets it. The other four factories are unchanged.

```typescript
export class ToolCallOutcome {
  private constructor(
    readonly result: string,
    readonly editEndPosition?: EditorPosition,
    readonly refusal?: string,
    private panelSummary?: string,
    readonly wroteThrough?: WritePath,
    // The text the ending appends to the history. Present only on an answer,
    // which is the one call that ends the turn it was made in.
    readonly answerEndingTheTurn?: string,
  ) {}

  static answered(result: string, answer: string): ToolCallOutcome
}
```

src/engine/turn/tool-call-executor.ts, the changed signature. The loop body is unchanged.

```typescript
export class ToolCallExecutor {
  // The first answer the batch published, or null where it published none.
  // Read after the loop rather than returned from inside it, so every call in
  // the batch still runs and the history keeps a result for each.
  async executeToolCalls(
    toolCalls: ToolCall[],
    refusals: RepeatedRefusalCounter,
  ): Promise<string | null>
}
```

src/engine/turn/ending/turn-ending-kind.ts, the sixth value.

```typescript
export enum TurnEndingKind {
  // The model answered from search, which is the turn's reply and needs no
  // step of its own to restate.
  Answered = 'answered',
}
```

src/engine/turn/ending/turn-result.ts, what a finished turn hands back.

```typescript
export class TurnResult {
  private constructor(
    readonly kind: TurnEndingKind,
    readonly outcome: Outcome<string>,
  ) {}

  static of(kind: TurnEndingKind, outcome: Outcome<string>): TurnResult

  static ofEndedTurn(endedTurn: EndedTurn): TurnResult

  answered(): boolean
}
```

src/engine/turn-ending-service.ts, one method added beside endTurnWithModelUtterance.

```typescript
export class TurnEndingService {
  // The answer is the turn's reply, so the history keeps it rather than the
  // restatement a further step would have written.
  endTurnWithAnswer(answer: string): EndedTurn
}
```

src/session/models/panel-action.ts, the action that settles an answered turn.

```typescript
export type PanelAction =
  // The turn ended on its answer, which the answer action already appended, so
  // this settles the turn and adds no entry of its own.
  | { type: 'turnAnswered' }
```

Changed signatures on existing types, each one method:

- ConversationTurnRunner.run (Engine Turn) returns Promise of TurnResult.
- EditEngine.processUtterance (Engine) returns Promise of TurnResult.
- UtteranceQueue.enqueue (Engine) returns Promise of TurnResult, and its runFn returns the same.
- SessionPanelProps.processUtterance (Session Views) returns Promise of TurnResult.
