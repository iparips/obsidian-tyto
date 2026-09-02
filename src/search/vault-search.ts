import { prepareSimpleSearch, SearchResult, TFile, Vault } from 'obsidian'
import { SearchHit } from './models/search-hit'
import { NoteExcerpt } from './note-excerpt'

const MAX_HITS = 8
const DAY_IN_MS = 24 * 60 * 60 * 1000

type Scorer = (text: string) => SearchResult | null

// Recency filters the candidates, it never joins the score: folding mtime into
// the score would let a stale exact match outrank a fresh relevant one, and
// neither the user nor the model could tell which had happened (FR25).
export class VaultSearch {
  constructor(private vault: Vault) {}

  async search(query: string, modifiedWithinDays?: number): Promise<readonly SearchHit[]> {
    const scorer = prepareSimpleSearch(query)
    const candidates = this.candidates(modifiedWithinDays)
    const hits = await Promise.all(candidates.map((file) => this.scoreFile(file, scorer)))
    return VaultSearch.best(hits.filter((hit): hit is SearchHit => hit !== null))
  }

  private candidates(modifiedWithinDays?: number): TFile[] {
    const files = this.vault.getMarkdownFiles()
    if (modifiedWithinDays === undefined) return files
    const cutoff = Date.now() - modifiedWithinDays * DAY_IN_MS
    return files.filter((file) => file.stat.mtime >= cutoff)
  }

  private async scoreFile(file: TFile, scorer: Scorer): Promise<SearchHit | null> {
    const content = await this.vault.cachedRead(file)
    const result = scorer(content)
    if (!result) return null
    return new SearchHit(file.path, result.score, VaultSearch.excerpt(content, result))
  }

  private static excerpt(content: string, result: SearchResult): string {
    const firstMatch = result.matches[0]
    return NoteExcerpt.around(content, firstMatch ? firstMatch[0] : 0)
  }

  private static best(hits: SearchHit[]): readonly SearchHit[] {
    return [...hits].sort((left, right) => right.score - left.score).slice(0, MAX_HITS)
  }
}
