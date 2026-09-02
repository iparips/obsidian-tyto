// One scored match, already trimmed to an excerpt: the payload sent to the
// model is fixed per hit, whatever the size of the note it came from.
export class SearchHit {
  constructor(
    readonly path: string,
    readonly score: number,
    readonly excerpt: string,
  ) {}

  describe(): string {
    return `${this.path} (score ${this.score.toFixed(2)}): ${this.excerpt}`
  }
}
