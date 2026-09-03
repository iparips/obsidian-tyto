import { SearchHit } from './search-hit'

// A session-scoped record of what the vault offered, so an opened note is one a
// search returned rather than one the model recalled (FR3). Finding a note is
// knowledge and does not expire the way consent to write to it does.
export class SeenPaths {
  private readonly paths = new Set<string>()

  record(hits: readonly SearchHit[]): void {
    this.recordPaths(hits.map((hit) => hit.path))
  }

  // Paths rather than hits, because a glob has no score and no excerpt and a
  // hit carrying empty ones would invite the model to read meaning into them.
  recordPaths(paths: readonly string[]): void {
    paths.forEach((path) => this.paths.add(path))
  }

  includes(path: string): boolean {
    return this.paths.has(path)
  }
}
