import { Minimatch } from 'minimatch'

// A shell's own vocabulary, so a model writing Week-3{5,6} or @(a|b) is writing
// correct glob rather than inventing syntax. Hand-translating the wildcards had
// covered four of them; the ones it matched literally each cost a turn.
//
// nocase because a recalled folder name varies in case. dot so a note under a
// dotted folder is reachable, since a vault path is not a shell listing and
// nothing here is hidden.
const OPTIONS = { nocase: true, dot: true }

// Compiled once per call, because a vault of a thousand notes tests the same
// pattern a thousand times.
export class PathPattern {
  private constructor(private readonly matcher: Minimatch | null) {}

  // A pattern that will not compile matches nothing rather than failing: a glob
  // returning no note is an answer (NFR5), and [[:digit:]] is the case that
  // throws, since minimatch emits a \p{Nd} that V8 rejects.
  static compile(pattern: string): PathPattern {
    return new PathPattern(PathPattern.compiled(pattern))
  }

  private static compiled(pattern: string): Minimatch | null {
    try {
      return new Minimatch(pattern, OPTIONS)
    } catch {
      return null
    }
  }

  matches(path: string): boolean {
    return this.matcher !== null && this.matcher.match(path)
  }
}
