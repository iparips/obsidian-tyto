// One row of the list: the tag as an edit would write it, and the number of
// notes carrying it rather than the number of times it appears.
export class TagCount {
  constructor(
    readonly tag: string,
    readonly noteCount: number,
  ) {}
}
