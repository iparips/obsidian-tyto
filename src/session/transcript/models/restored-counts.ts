// What a restored session's record already holds, counted so the first step
// after a restore indexes past it rather than over it. The three travel
// together because a step's range is only meaningful against all of them.
export class RestoredCounts {
  private constructor(
    readonly messages: number,
    readonly progressLines: number,
    readonly turns: number,
  ) {}

  static none(): RestoredCounts {
    return new RestoredCounts(0, 0, 0)
  }

  static of(messages: number, progressLines: number, turns: number): RestoredCounts {
    return new RestoredCounts(messages, progressLines, turns)
  }
}
