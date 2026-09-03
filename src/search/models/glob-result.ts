// The total is held beside the rows rather than derived from them, because the
// rows are what survived the cap and the total is what the model must be told
// about (FR13).
export class GlobResult {
  constructor(
    readonly paths: readonly string[],
    readonly total: number,
  ) {}

  wasTrimmed(): boolean {
    return this.total > this.paths.length
  }
}
