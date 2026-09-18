import { TagCount } from './models/tag-count'
import { TagListResult } from './models/tag-list-result'

// What the model reads back from a tag listing. A second reporter beside
// SearchReport rather than a third method on it: a row is a count and a name
// where a glob row is a path, and the empty case is a statement about the vault
// rather than about a pattern.
export class TagReport {
  static buildReport(filter: string | null, result: TagListResult): string {
    if (result.total === 0) return TagReport.buildEmptyMessage(filter)
    const rows = result.tags.map(TagReport.buildRow)
    return [...rows, ...TagReport.buildTrimmedLine(rows.length, result)].join('\n')
  }

  // Told only that nothing matched, the model retries narrower filters, which
  // is the failure SearchReport.noGlobMatch exists to prevent for globs.
  private static buildEmptyMessage(filter: string | null): string {
    if (filter === null) return 'this vault uses no tags'
    return `no tag contains ${filter}; call list_tags with no filter to see the vocabulary`
  }

  // The count reads in words so the model does not read a bare number as a rank.
  private static buildRow(row: TagCount): string {
    return `${row.tag} - ${row.noteCount} ${row.noteCount === 1 ? 'note' : 'notes'}`
  }

  // Points at the filter rather than at a pattern, since narrowing a tag
  // listing is the one thing the filter argument does.
  private static buildTrimmedLine(shown: number, result: TagListResult): string[] {
    if (!result.wasTrimmed()) return []
    return [`showing the top ${shown} of ${result.total} tags; narrow with filter to see the rest`]
  }
}
