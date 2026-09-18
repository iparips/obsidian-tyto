import { getAllTags, MetadataCache, TFile, Vault } from 'obsidian'
import { TagCount } from './models/tag-count'
import { TagListResult } from './models/tag-list-result'

// Fifty, mirroring MAX_GLOB_RESULTS: a vocabulary trimmed shorter than that
// stops being the vault's conventions and starts being a sample.
export const MAX_TAG_RESULTS = 50

// The vault lists the markdown files and the cache answers each file's tags, so
// this takes both where every other search class takes the vault alone.
//
// No cachedRead anywhere in this class: the cache already holds the tags, so a
// tally must not cost a read.
export class TagReader {
  constructor(
    private vault: Vault,
    private metadataCache: MetadataCache,
  ) {}

  // A null filter lists everything. The filter is applied after the tally, so a
  // filtered row still carries its whole-vault count.
  findTags(filter: string | null): TagListResult {
    const tallied = this.tallyNotesPerTag()
    const matching = TagReader.sorted(tallied).filter((row) => TagReader.matches(row, filter))
    return new TagListResult(matching.slice(0, MAX_TAG_RESULTS), matching.length)
  }

  private tallyNotesPerTag(): Map<string, number> {
    const tally = new Map<string, number>()
    this.vault.getMarkdownFiles().forEach((file) => {
      this.tagsOf(file).forEach((tag) => tally.set(tag, (tally.get(tag) ?? 0) + 1))
    })
    return tally
  }

  // Through a Set, so a tag written twice in one note counts that note once. A
  // note Obsidian holds no cache entry for is skipped rather than failing.
  private tagsOf(file: TFile): Set<string> {
    const cache = this.metadataCache.getFileCache(file)
    return new Set(cache ? (getAllTags(cache) ?? []) : [])
  }

  // By count descending, then by tag ascending, so a vault where many tags are
  // used once returns a stable order rather than the file walk's.
  private static sorted(tally: Map<string, number>): TagCount[] {
    return [...tally.entries()]
      .map(([tag, noteCount]) => new TagCount(tag, noteCount))
      .sort((left, right) => right.noteCount - left.noteCount || left.tag.localeCompare(right.tag))
  }

  private static matches(row: TagCount, filter: string | null): boolean {
    if (filter === null) return true
    return row.tag.toLowerCase().includes(filter.toLowerCase())
  }
}
