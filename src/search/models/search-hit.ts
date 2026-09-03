// One matched note, already trimmed to an excerpt: the payload sent to the
// model is fixed per hit, whatever the size of the note it came from. The score
// is the match count, which is what that field always effectively held.
export class SearchHit {
  constructor(
    readonly path: string,
    readonly score: number,
    readonly excerpt: string,
  ) {}

  // A count rather than a decimal score, since a count is not a relevance
  // figure and rendering it as one invites the model to read it as ranking.
  describe(): string {
    return `${this.path} (${SearchHit.matchCount(this.score)}): ${this.excerpt}`
  }

  private static matchCount(score: number): string {
    return `${score} ${score === 1 ? 'match' : 'matches'}`
  }
}
