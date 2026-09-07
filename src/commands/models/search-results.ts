import { ObsidianCommandMatch } from './obsidian-command-match'

export class SearchResults {
  constructor(
    readonly matches: readonly ObsidianCommandMatch[],
    readonly overflowed: boolean,
  ) {}

  static empty(): SearchResults {
    return new SearchResults([], false)
  }
}
