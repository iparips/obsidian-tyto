import { CommandMatch } from './command-match'

export class SearchResults {
  constructor(
    readonly matches: readonly CommandMatch[],
    readonly overflowed: boolean,
  ) {}

  static empty(): SearchResults {
    return new SearchResults([], false)
  }
}
