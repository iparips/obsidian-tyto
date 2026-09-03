import { TFile, Vault } from 'obsidian'
import { Attempt, Outcomes } from '../shared/models/outcome'
import { GrepRequest } from './models/grep-request'
import { GrepResult } from './models/grep-result'
import { ResultOrder, SortKeys } from './models/result-order'
import { SearchHit } from './models/search-hit'
import { NoteExcerpt } from './note-excerpt'

// Ten with excerpts, because a row carries a 200-character one; fifty without,
// because the rows are paths again.
const MAX_HITS = 10
const MAX_PATHS = 50

// The hit beside the note it came from, so the modification time is sortable
// without SearchHit growing a field only the ordering reads.
interface DatedHit {
  hit: SearchHit
  modified: number
}

const SORT_KEYS: SortKeys<DatedHit> = {
  path: (dated) => dated.hit.path,
  modified: (dated) => dated.modified,
  matches: (dated) => dated.hit.score,
}

// The path filter runs before the read, so narrowing a grep to a folder costs
// one pass over paths rather than a read of every note in the vault.
export class NoteGrep {
  constructor(private vault: Vault) {}

  async find(request: GrepRequest, order: ResultOrder): Promise<Attempt<GrepResult>> {
    const expression = NoteGrep.compiled(request.pattern)
    if (expression === null) return NoteGrep.invalid(request.pattern)
    const admitted = this.vault.getMarkdownFiles().filter((file) => request.admits(file.path))
    if (admitted.length === 0) return Outcomes.success(NoteGrep.readNothing(request))
    return Outcomes.success(await this.searched(admitted, expression, request, order))
  }

  // The model's expression, compiled once per call. Case-insensitive because
  // prose varies, and global because the count is what `sort: matches` orders by.
  private static compiled(pattern: string): RegExp | null {
    try {
      return new RegExp(pattern, 'gi')
    } catch {
      return null
    }
  }

  private static invalid(pattern: string): Attempt<GrepResult> {
    return Outcomes.failure('apply', `${pattern} is not a valid regular expression`)
  }

  private static readNothing(request: GrepRequest): GrepResult {
    return new GrepResult([], 0, request.pathsOnly, request.narrows())
  }

  private async searched(
    files: readonly TFile[],
    expression: RegExp,
    request: GrepRequest,
    order: ResultOrder,
  ): Promise<GrepResult> {
    const scanned = await Promise.all(files.map((file) => this.scan(file, expression, request)))
    const found = scanned.filter((dated): dated is DatedHit => dated !== null)
    return NoteGrep.capped(order.sorted(found, SORT_KEYS), found.length, request)
  }

  // The expression runs against the note's full text rather than line by line:
  // a sentence wraps, and a pattern that must match within one line would miss
  // what the user is looking for.
  private async scan(
    file: TFile,
    expression: RegExp,
    request: GrepRequest,
  ): Promise<DatedHit | null> {
    const content = await this.vault.cachedRead(file)
    const matches = [...content.matchAll(expression)]
    if (matches.length === 0) return null
    const excerpt = NoteGrep.excerpt(content, matches, request)
    return { hit: new SearchHit(file.path, matches.length, excerpt), modified: file.stat.mtime }
  }

  // One excerpt per note rather than per match: the count is what sorting
  // wants, and every offset would unbound the payload a hit costs.
  private static excerpt(
    content: string,
    matches: RegExpMatchArray[],
    request: GrepRequest,
  ): string {
    if (request.pathsOnly) return ''
    return NoteExcerpt.around(content, matches[0].index ?? 0)
  }

  private static capped(found: DatedHit[], total: number, request: GrepRequest): GrepResult {
    const cap = request.pathsOnly ? MAX_PATHS : MAX_HITS
    return new GrepResult(
      found.slice(0, cap).map((dated) => dated.hit),
      total,
      request.pathsOnly,
    )
  }
}
