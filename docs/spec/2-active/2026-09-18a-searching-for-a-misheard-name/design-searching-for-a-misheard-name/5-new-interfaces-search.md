---
created: 2026-09-18
updated: 2026-09-18
---

# Design: New Interfaces In Search

Every type the change introduces or alters under src/search, ordered as the rollout orders the commits. The engine and provider ones are in [6-new-interfaces-engine.md](6-new-interfaces-engine.md). Part of [1-index.md](1-index.md).

## New interfaces

Ordered as the rollout in [7-scope-and-rollout.md](7-scope-and-rollout.md) orders the commits.

src/search/models/note-excerpt.ts, one window of a matched note. A value object, where today's NoteExcerpt is a cutter returning a string; the cutting moves to NoteExcerpts.

```ts
export class NoteExcerpt {
  constructor(
    readonly startLine: number,
    readonly endLine: number,
    readonly text: string,
    // How many matches this window holds, so a merged block says so rather than
    // looking like matches went missing against the note's total.
    readonly matchCount: number,
  ) {}
}
```

src/search/note-excerpts.ts, the cutting and the merging. Replaces src/search/note-excerpt.ts, whose one caller is the method being changed.

```ts
// Fifteen lines per match: a window wider than a screenful stops being context
// and becomes the note, which read_note already does better.
export const MAX_CONTEXT_LINES = 15
export const DEFAULT_CONTEXT_LINES = 3

export class NoteExcerpts {
  // Windows that touch or overlap come back as one excerpt carrying both counts,
  // as grep -C merges them.
  static buildExcerpts(
    content: string,
    matches: readonly RegExpMatchArray[],
    contextLines: number,
  ): readonly NoteExcerpt[]
}
```

src/search/models/search-hit.ts, a changed field on the existing SearchHit class. The excerpt string becomes a list, and describe is deleted: rendering a block belongs in SearchReport, which already owns what the model reads.

```ts
export class SearchHit {
  constructor(
    readonly path: string,
    readonly score: number,
    readonly excerpts: readonly NoteExcerpt[],
  ) {}
}
```

src/search/models/grep-request.ts, an added constructor parameter and accessor on the existing GrepRequest class. Appended after the existing required parameters, per the constructor rule.

```ts
// Clamped here rather than in NoteGrep: the request is where the model's
// arguments are already validated, so an out-of-range width cannot travel.
constructor(
  readonly pattern: string,
  readonly pathPattern: string | null,
  readonly paths: readonly string[],
  readonly pathsOnly: boolean,
  contextLines: number | null = null,
)

getContextLines(): number
```

src/search/note-grep.ts, a changed constant on the existing NoteGrep file.

```ts
// Six rather than ten: a row is a block of excerpts now, not one 200-character
// line, so the same payload buys fewer notes seen properly.
const MAX_HITS = 6
```

