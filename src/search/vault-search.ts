import { prepareSimpleSearch, SearchResult, TFile, Vault } from 'obsidian'
import { SearchHit } from './models/search-hit'
import { NoteExcerpt } from './note-excerpt'

const MAX_HITS = 8
const DAY_IN_MS = 24 * 60 * 60 * 1000
// A path match counts for more than a content match, since naming a folder or a
// date is a more specific request than mentioning the same words in prose.
const PATH_WEIGHT = 2

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

  // The path is scored beside the content, because a vault organised by date
  // holds "Week-35" in a folder name and nowhere in any note's text. Searching
  // content alone cannot reach such a note at all.
  private async scoreFile(file: TFile, scorer: Scorer): Promise<SearchHit | null> {
    const content = await this.vault.cachedRead(file)
    const byPath = scorer(file.path)
    const byContent = scorer(content)
    if (!byPath && !byContent) return null
    return VaultSearch.bestHit(file, content, byPath, byContent)
  }

  // A path match outranks a content match of the same strength: the user who
  // names a folder or a date means that note, where a note merely mentioning
  // the words is a weaker answer to the same query.
  private static bestHit(
    file: TFile,
    content: string,
    byPath: SearchResult | null,
    byContent: SearchResult | null,
  ): SearchHit {
    const pathScore = byPath ? byPath.score * PATH_WEIGHT : 0
    if (byContent && byContent.score >= pathScore)
      return new SearchHit(file.path, byContent.score, VaultSearch.excerpt(content, byContent))
    return new SearchHit(file.path, pathScore, VaultSearch.pathExcerpt(content))
  }

  // A path hit has no match offset inside the note, so the excerpt is the head
  // of it: what the note opens with is what says whether it is the right one.
  private static pathExcerpt(content: string): string {
    return NoteExcerpt.around(content, 0)
  }

  private static excerpt(content: string, result: SearchResult): string {
    const firstMatch = result.matches[0]
    return NoteExcerpt.around(content, firstMatch ? firstMatch[0] : 0)
  }

  private static best(hits: SearchHit[]): readonly SearchHit[] {
    return [...hits].sort((left, right) => right.score - left.score).slice(0, MAX_HITS)
  }
}
