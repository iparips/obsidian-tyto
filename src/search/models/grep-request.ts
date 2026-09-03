import { PathPattern } from './path-pattern'

// What HarnessTools builds from the tool call: the expression, the two
// narrowings, and whether paths alone are wanted. A value rather than four
// arguments, because nothing else constructs one.
export class GrepRequest {
  private readonly compiled: PathPattern | null

  constructor(
    readonly pattern: string,
    readonly pathPattern: string | null,
    readonly paths: readonly string[],
    readonly pathsOnly: boolean,
  ) {
    this.compiled = pathPattern === null ? null : PathPattern.compile(pathPattern)
  }

  // Both narrowings apply where both are given, so a model that passes each
  // gets the intersection. One silently overriding the other is how a search
  // returns a confident answer to a question it did not ask.
  admits(path: string): boolean {
    return this.admitsByPattern(path) && this.admitsByList(path)
  }

  narrows(): boolean {
    return this.compiled !== null || this.paths.length > 0
  }

  private admitsByPattern(path: string): boolean {
    return this.compiled === null || this.compiled.matches(path)
  }

  // An empty list is no filter rather than no notes. A model sending one almost
  // certainly has no list to offer, and reading it literally returns "no notes
  // contain X" for a search that never looked at one.
  private admitsByList(path: string): boolean {
    return this.paths.length === 0 || this.paths.includes(path)
  }
}
