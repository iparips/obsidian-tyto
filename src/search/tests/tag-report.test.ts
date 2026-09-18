import { describe, expect, it } from 'vitest'
import { TagReport } from '../tag-report'
import { TagCount } from '../models/tag-count'
import { TagListResult } from '../models/tag-list-result'

describe('TagReport', () => {
  const buildReport = (result: TagListResult, filter: string | null = null) =>
    TagReport.buildReport(filter, result)

  describe('when tags come back', () => {
    it('lists each tag with its note count', () => {
      const result = new TagListResult(
        [new TagCount('#journal', 312), new TagCount('#health', 48)],
        2,
      )

      expect(buildReport(result)).toBe('#journal - 312 notes\n#health - 48 notes')
    })

    it('writes a count of one as one note, so the row reads', () => {
      const result = new TagListResult([new TagCount('#roofing', 1)], 1)

      expect(buildReport(result)).toBe('#roofing - 1 note')
    })

    it('adds no trimmed line when the rows fit', () => {
      const result = new TagListResult([new TagCount('#journal', 312)], 1)

      expect(buildReport(result)).toBe('#journal - 312 notes')
    })

    it('names the shown count and the total when the cap trimmed the rows', () => {
      const result = new TagListResult([new TagCount('#journal', 312)], 87)

      expect(buildReport(result)).toBe(
        '#journal - 312 notes\nshowing the top 1 of 87 tags; narrow with filter to see the rest',
      )
    })

    it('tells the model to narrow with the filter rather than with a pattern', () => {
      const result = new TagListResult([new TagCount('#journal', 312)], 87)

      expect(buildReport(result)).toContain('narrow with filter')
    })
  })

  describe('when nothing comes back', () => {
    const empty = new TagListResult([], 0)

    it('says the vault uses no tags when no filter was given', () => {
      expect(buildReport(empty)).toBe('this vault uses no tags')
    })

    it('names the filter that matched nothing when one was given', () => {
      expect(buildReport(empty, 'journal')).toContain('no tag contains journal')
    })

    it('tells the model to call again without a filter, so it widens rather than narrows', () => {
      expect(buildReport(empty, 'journal')).toBe(
        'no tag contains journal; call list_tags with no filter to see the vocabulary',
      )
    })
  })
})
