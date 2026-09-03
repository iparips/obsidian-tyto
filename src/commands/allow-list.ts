const WILDCARD = '*'

// Entries are ids or namespace patterns. Only a pattern needs the colon: the
// plugin id before it is literal, so a wildcard can only ever reach what one
// plugin registered (FR4). An exact id matches one command and cannot
// over-reach, and Obsidian's core commands are not namespaced at all.
export class AllowList {
  constructor(private readonly entries: readonly string[]) {}

  permits(commandId: string): boolean {
    return this.coveringEntry(commandId) !== null
  }

  // Which entry permitted, not whether one did: the picker renders a
  // pattern-covered command differently from an exactly-listed one (FR6).
  coveringEntry(commandId: string): string | null {
    return this.entries.find((entry) => AllowList.matches(entry, commandId)) ?? null
  }

  private static matches(entry: string, commandId: string): boolean {
    if (!AllowList.isValid(entry)) return false
    if (!entry.endsWith(WILDCARD)) return entry === commandId
    return commandId.startsWith(entry.slice(0, -WILDCARD.length))
  }

  // Refused at save time rather than at match time: a pattern that cannot be
  // expressed is a settings error the user can see, not a silent no-match.
  static validate(entry: string): string | null {
    if (!entry.includes(WILDCARD)) return null
    const colon = entry.indexOf(':')
    if (colon === -1) return 'a pattern must name a plugin, as plugin-id:*'
    if (entry.slice(0, colon).includes(WILDCARD)) return 'a wildcard cannot appear in the plugin id'
    return AllowList.validateSuffix(entry.slice(colon + 1))
  }

  private static validateSuffix(suffix: string): string | null {
    const wildcards = suffix.split(WILDCARD).length - 1
    if (wildcards === 0) return null
    if (wildcards > 1 || !suffix.endsWith(WILDCARD))
      return 'a wildcard may only appear at the end of an entry'
    return null
  }

  private static isValid(entry: string): boolean {
    return AllowList.validate(entry) === null
  }
}
