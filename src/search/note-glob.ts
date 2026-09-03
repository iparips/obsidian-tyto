import { TFile, Vault } from 'obsidian'
import { GlobResult } from './models/glob-result'
import { PathPattern } from './models/path-pattern'
import { ResultOrder } from './models/result-order'

// Fifty, because a real folder listing is never trimmed at that size, and a
// trimmed listing is exactly the case where the model starts guessing again.
export const MAX_GLOB_RESULTS = 50

// No cachedRead anywhere in this class: a path match must not cost a read
// (NFR2), which is what makes listing cheap enough to use speculatively.
export class NoteGlob {
  constructor(private vault: Vault) {}

  find(pattern: string, order: ResultOrder): GlobResult {
    const matched = NoteGlob.matching(this.vault.getMarkdownFiles(), pattern)
    const sorted = order.sorted(matched, { path: (file) => file.path, modified: NoteGlob.mtimeOf })
    return new GlobResult(NoteGlob.capped(sorted), matched.length)
  }

  private static matching(files: readonly TFile[], pattern: string): TFile[] {
    const compiled = PathPattern.compile(pattern)
    return files.filter((file) => compiled.matches(file.path))
  }

  private static mtimeOf(file: TFile): number {
    return file.stat.mtime
  }

  private static capped(files: readonly TFile[]): string[] {
    return files.slice(0, MAX_GLOB_RESULTS).map((file) => file.path)
  }
}
