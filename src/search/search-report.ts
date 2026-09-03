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
    if (!SearchReport.looksLikeFolder(pattern)) return `no notes match ${pattern}`
    return `no notes match ${pattern}; this matches notes, not folders, and * stops at a / — to list what is inside, end the pattern with /* or use **`
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
  static ofGrep(pattern: string, result: GrepResult): string {
    if (result.readNothing) return `no notes to search: the narrowing matched none`
    if (result.total === 0) return `no notes contain ${pattern}`
    return [
      ...SearchReport.rows(result),
      ...SearchReport.trimmedLine(result.hits.length, result),
    ].join('\n')
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
