import { SearchHit } from '../../search/models/search-hit'

// The holder states the scope. The session's copy makes an opened note one the
// vault returned rather than one the model recalled (FR3), and finding a note
// does not expire the way consent to write to it does. TurnRepository holds a
// per-turn copy of search results alone, which decides how the turn may end.
export class PathsReturnedByVaultRepository {
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

  // Whether anything was recorded, which is not the same as whether a search
  // ran: a search that matched nothing leaves the model with
  // nothing to cite, and a turn ending in text is then the honest ending.
  foundAnything(): boolean {
    return this.paths.size > 0
  }

  // Longest first, so a path is tested before any path it contains: a citation
  // of a folder's index note must not count as citing a note beneath it.
  pathsLongestFirst(): string[] {
    return [...this.paths].sort((one, other) => other.length - one.length)
  }
}
