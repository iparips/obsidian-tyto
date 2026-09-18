// One token of a glob: a wildcard, a character class, or a single character to
// be taken literally. Ordered longest-first, so `**/` wins over `**` and `**`
// over `*`. The class alternative requires a closing bracket on the same path
// segment, which is what leaves a stray `[` to the literal branch.
const TOKEN = /\*\*\/|\*\*|\*|\?|\[[!^]?[^/\]]+\]|[\s\S]/g

// Every regular-expression character, so a folder named `1 - Journal` or
// `Notes (old)` is matched literally rather than parsed.
const REGEXP_CHARACTER = /[.*+?^${}()|[\]\\]/g

// Compiled once per call, because a vault of a thousand notes tests the same
// pattern a thousand times. A regular expression rather than a segment walk:
// the wildcards are a translation, and a walk would reimplement backtracking
// for `**`.
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

  // One pass, each token decided once. Escaping the whole pattern and then
  // restoring the wildcards would mean matching escaped text to find them,
  // which is how a character class reads as a folder named with brackets.
  private static translated(pattern: string): string {
    return (pattern.match(TOKEN) ?? []).map(PathPattern.asExpression).join('')
  }

  // `**/` collapses to an optional group, so `**/*.md` reaches a note at the
  // vault root: treating `**` as `.*` alone would require the separator.
  // Neither `*` nor `?` nor a class crosses a `/`, since a pattern says which
  // segment it is about.
  private static asExpression(token: string): string {
    if (token === '**/') return '(?:.*/)?'
    if (token === '**') return '.*'
    if (token === '*') return '[^/]*'
    if (token === '?') return '[^/]'
    if (PathPattern.isClass(token)) return PathPattern.asClass(token)
    return token.replace(REGEXP_CHARACTER, '\\$&')
  }

  private static isClass(token: string): boolean {
    return token.length > 2 && token.startsWith('[') && token.endsWith(']')
  }

  // A shell glob's character class, `[5-8]` or `[!x]`. A shell negates on `!`
  // where a regular expression uses `^`, and accepts either, so both are read
  // and written as the one a regular expression means.
  private static asClass(token: string): string {
    const negated = token[1] === '!' || token[1] === '^'
    return `[${negated ? '^' : ''}${token.slice(negated ? 2 : 1, -1)}]`
  }
}
