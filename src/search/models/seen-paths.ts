import { SearchHit } from './search-hit'

// A turn-scoped record of what the vault offered, so an opened note is one
// search confirmed rather than one the model recalled (FR3).
export class SeenPaths {
  private readonly paths = new Set<string>()

  record(hits: readonly SearchHit[]): void {
    hits.forEach((hit) => this.paths.add(hit.path))
  }

  includes(path: string): boolean {
    return this.paths.has(path)
  }
}
