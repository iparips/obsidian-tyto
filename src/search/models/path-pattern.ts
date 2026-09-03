// Compiled once per call, because a vault of a thousand notes tests the same
// pattern a thousand times. A regular expression rather than a segment walk:
// the three wildcards are a translation, and a walk would reimplement
// backtracking for `**`.
export class PathPattern {
  private constructor(private readonly expression: RegExp) {}

  // No Attempt: every character that is not a wildcard is escaped, so nothing
  // a caller can pass fails to compile. A pattern matching nothing is an
  // answer rather than an error (NFR5).
  static compile(pattern: string): PathPattern {
    return new PathPattern(new RegExp(`^${PathPattern.translated(pattern)}$`, 'i'))
  }

  matches(path: string): boolean {
    return this.expression.test(path)
  }

  // `**/` collapses to an optional group, so `**/*.md` reaches a note at the
  // vault root: treating `**` as `.*` alone would require the separator.
  private static translated(pattern: string): string {
    return PathPattern.escaped(pattern)
      .replace(/\\\*\\\*\//g, '(?:.*/)?')
      .replace(/\\\*\\\*/g, '.*')
      .replace(/\\\*/g, '[^/]*')
      .replace(/\\\?/g, '[^/]')
  }

  // Every regular-expression character, so a folder named `1 - Journal` or
  // `Notes (old)` is matched literally rather than parsed. The wildcards are
  // escaped here too, and translated out of that escaped form above.
  private static escaped(pattern: string): string {
    return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
