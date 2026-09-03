import { AllowList } from './allow-list'
import { CommandRegistry } from './command-registry'
import { AllowedCommand } from './models/allowed-command'
import { CommandMatch } from './models/command-match'
import { SearchResults } from './models/search-results'

// Twenty fits a desktop panel without scrolling far, and a query matching more
// is too broad to pick from: the overflow line says type more, not page (FR3).
const CAP = 20

// The catalogue's opposite question: every command annotated with whether the
// allow-list covers it, rather than only the ones it does.
export class CommandSearch {
  constructor(
    private registry: CommandRegistry,
    private allowList: AllowList,
  ) {}

  // A blank query returns nothing, so the picker renders nothing before the
  // user types (FR4). Matching is a substring of the name, never the id: recall
  // matters more than ranking when the user reads a name off the palette.
  matching(query: string): SearchResults {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) return SearchResults.empty()
    const matched = this.matchingName(needle)
    return new SearchResults(
      matched.slice(0, CAP).map((command) => this.matchOf(command)),
      matched.length > CAP,
    )
  }

  private matchingName(needle: string): readonly AllowedCommand[] {
    return this.registry.list().filter((command) => command.name.toLowerCase().includes(needle))
  }

  private matchOf(command: AllowedCommand): CommandMatch {
    return new CommandMatch(command, this.allowList.coveringEntry(command.id))
  }
}
