---
created: 2026-09-18
updated: 2026-09-18
---

# Design: New Interfaces In Engine And Providers

The guard, the two new endings, the continuation prompt and the overflow recogniser. The search ones are in [5-new-interfaces-search.md](5-new-interfaces-search.md). Part of [1-index.md](1-index.md).

## New interfaces

src/engine/tools/harness-results.ts, an added field on the existing TextResult class. Appended after the existing optional parameter.

```ts
// Undefined for every tool but a search, so the counter reads a structured fact
// rather than matching what SearchReport rendered.
constructor(
  readonly result: string,
  readonly publishStepSummary?: ProgressLine,
  readonly foundNothing?: boolean,
)
```

src/engine/turn/spending/empty-search-counter.ts, the guard. Beside RepeatedRefusalCounter, which it is shaped after.

```ts
// Two, matching RepeatedRefusalCounter: a second search that finds nothing is
// rarely the one that works, and a widened search that matches clears the count.
const MAX_EMPTY_SEARCHES = 2

export class EmptySearchCounter {
  // Undefined is not a search and leaves the count alone; false clears it.
  record(foundNothing: boolean | undefined): void

  isStuck(): boolean

  // What the turn ends with, so the user reads the reason rather than a count.
  message(): string
}
```

src/engine/turn/ending/turn-ending-kind.ts, two added values on the existing enum.

```ts
// The searches found nothing twice over, which the prompt warned about.
FoundNothing = 'foundNothing',
// The model call exceeded the context window, so the turn offers a way to resume.
Overflowed = 'overflowed',
```

src/engine/turn/ending/turn-outcomes.ts, an added factory on the existing TurnOutcomes class.

```ts
static foundNothing(searches: EmptySearchCounter): EndedTurn
```

src/engine/turn/ending/continuation-prompt.ts, the text a fresh session is handed. A value with one factory, built from turn-scoped state alone.

```ts
export class ContinuationPrompt {
  private constructor(
    readonly text: string,
    readonly sourcePaths: readonly string[],
  ) {}

  // Never the session-scoped paths a search returned: those hold earlier turns'
  // findings and would be presented as this turn's.
  static buildFrom(utterance: string, notesRead: readonly string[]): ContinuationPrompt
}
```

src/engine/turn/notes-read-repository.ts, an added accessor on the existing NotesReadRepository class. It exposes only includes today.

```ts
getPathsRead(): readonly string[]
```

src/engine/turn/turn-repository.ts, an added accessor on the existing TurnRepository class. The utterance is turn-scoped state the turn does not currently hold, and the ending needs it.

```ts
getUtterance(): string
```

src/model/providers/context-overflow.ts, telling an overflow from a bad key or a rate limit.

```ts
// Matched as a sentinel by TurnEndingService rather than compared as prose: a
// failure message compared by its wording is how this rots.
export const CONTEXT_OVERFLOW = 'context-overflow'

export class ContextOverflow {
  static isOverflow(status: number, body: string): boolean
}
```

src/engine/turn-ending-service.ts, an added method on the existing TurnEndingService class. It publishes through the publisher answer_from_search already uses, so the panel needs no new entry kind.

```ts
endTurnAsOverflowed(utterance: string, notesRead: readonly string[]): EndedTurn
```

src/engine/tools/tool-schemas.ts gains one optional context_lines property on the grep_notes schema. required is unchanged: pattern alone.

