import { TagCount } from './tag-count'

// The total is held beside the rows rather than derived from them, in the shape
// GlobResult holds: the rows are what survived the cap, and the total is what
// the model must be told about.
export class TagListResult {
  constructor(
    readonly tags: readonly TagCount[],
    readonly total: number,
  ) {}

  wasTrimmed(): boolean {
    return this.total > this.tags.length
  }
}
