import { SearchHit } from './search-hit'

// The total is held beside the rows rather than derived from them, because the
// rows are what survived the cap and the total is what the model must be told
// about (FR13).
export class GrepResult {
  constructor(
    readonly hits: readonly SearchHit[],
    readonly total: number,
    readonly pathsOnly: boolean,
    // A narrowing that admitted no note at all, which is not the same answer as
    // a text that is absent (FR6c). Reporting it as no match would tell the
    // model its text is missing when what is wrong is its scope.
    readonly readNothing: boolean = false,
  ) {}

  wasTrimmed(): boolean {
    return this.total > this.hits.length
  }
}
