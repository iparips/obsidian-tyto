import { GlobResult } from './models/glob-result'
import { GrepResult } from './models/grep-result'

// What the model reads back from a search. Specified here rather than left to
// each searcher, because the result string is what the model acts on.
export class SearchReport {
  static ofGlob(pattern: string, result: GlobResult): string {
    if (result.total === 0) return SearchReport.noGlobMatch(pattern)
    return [...result.paths, ...SearchReport.trimmedLine(result.paths.length, result)].join('\n')
  }

  // A glob matches notes, never folders, so a pattern aimed at a folder always
  // matches nothing. Told only "no notes match", the model retries variants of
  // the same folder-shaped pattern until the cap stops it.
  private static noGlobMatch(pattern: string): string {
    const reason = SearchReport.whyItCannotMatch(pattern)
    if (reason) return `no notes match ${pattern}; ${reason}`
    return `no notes match ${pattern}`
  }

  // Ordered by how badly each misleads: a pattern wrong in its shape cannot
  // match whatever the rest of it says, so no rewording of the rest fixes it.
  private static whyItCannotMatch(pattern: string): string | null {
    if (SearchReport.hasUnclosedClass(pattern))
      return 'a character class opened with [ and did not close on the same folder name, so the [ matched itself — close it, as Week-3[5-8] does'
    if (SearchReport.looksLikeFolder(pattern))
      return 'this matches notes, not folders, and * stops at a / — to list what is inside, end the pattern with /* or use **'
    return null
  }

  // Read per segment, since a class never spans a /: an opening bracket with no
  // closing one after it in the same segment is the case that matched itself.
  private static hasUnclosedClass(pattern: string): boolean {
    return pattern
      .split('/')
      .some((segment) => segment.includes('[') && !segment.includes(']', segment.indexOf('[')))
  }

  // The last segment names a folder when it carries a prefix beside its
  // wildcard and no extension: "Week-*" is a folder name, where a bare "*" is a
  // correct listing of the folder above it.
  private static looksLikeFolder(pattern: string): boolean {
    const segment = pattern.slice(pattern.lastIndexOf('/') + 1)
    if (segment.includes('.')) return false
    return segment !== '*' && segment !== '**'
  }

  // The "nothing to read" case is grep's alone and is not the same as no match
  // (FR6c): a scope that admitted no note and a text that is absent are
  // different answers to different questions.
  // A narrowed grep that found nothing says so about the narrowing rather than
  // about the vault: "no notes contain X" reads as an answer to a question the
  // search never asked, and is what sends a model on to widen the pattern.
  static ofGrep(pattern: string, result: GrepResult, scope?: string): string {
    if (result.readNothing) return SearchReport.readNothing(scope)
    if (result.total === 0) return SearchReport.foundNothing(pattern, scope)
    return [
      ...SearchReport.rows(result),
      ...SearchReport.trimmedLine(result.hits.length, result),
    ].join('\n')
  }

  // The narrowing admitted no note, so nothing was read and the text was never
  // the question. Names the narrowing and, where its shape cannot match at all,
  // says so: the same diagnosis a glob gives, since both take the same pattern.
  private static readNothing(scope?: string): string {
    if (scope === undefined) return 'no notes to search: the narrowing matched none'
    const reason = SearchReport.whyItCannotMatch(scope)
    if (reason) return `no notes to search: ${scope} matched none; ${reason}`
    return `no notes to search: ${scope} matched none, so nothing was read for the pattern`
  }

  private static foundNothing(pattern: string, scope?: string): string {
    if (scope === undefined) return `no notes contain ${pattern}`
    return `no notes in ${scope} contain ${pattern}; the search went no wider than that`
  }

  private static rows(result: GrepResult): string[] {
    if (result.pathsOnly) return result.hits.map((hit) => hit.path)
    return result.hits.map((hit) => hit.describe())
  }

  // Names the cap and the total, because a model told it saw everything answers
  // "are there others?" differently from one told it saw ten of forty (FR13).
  private static trimmedLine(shown: number, result: GlobResult | GrepResult): string[] {
    if (!result.wasTrimmed()) return []
    return [`showing the first ${shown} of ${result.total}; narrow the pattern to see the rest`]
  }
}
