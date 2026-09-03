import { describe, expect, it } from 'vitest'
import { SearchReport } from '../search-report'
import { GlobResult } from '../models/glob-result'

const NOTHING = new GlobResult([], 0)

// A glob matches notes, never folders, so a folder-shaped pattern always
// matches nothing. Told only "no notes match", the model retries variants of
// the same shape until the glob cap stops the turn.
describe('SearchReport', () => {
  describe('when a folder-shaped pattern matches nothing', () => {
    it('says a glob matches notes rather than folders when the last segment names one', () => {
      const report = SearchReport.ofGlob('1 - Journal/Weekly/Week-*', NOTHING)

      expect(report).toContain('this matches notes, not folders')
    })

    it('names the pattern that matched nothing, so the model sees what it asked for', () => {
      const report = SearchReport.ofGlob('1 - Journal/Weekly/Week-*', NOTHING)

      expect(report).toContain('no notes match 1 - Journal/Weekly/Week-*')
    })

    it('says how to list what is inside, so the next glob is a listing', () => {
      const report = SearchReport.ofGlob('1 - Journal/Weekly/Week-*', NOTHING)

      expect(report).toContain('end the pattern with /* or use **')
    })

    it('hints when a partial filename matched nothing, since widening is the fix', () => {
      const report = SearchReport.ofGlob('Journal/Week-35/08-28*', NOTHING)

      expect(report).toContain('this matches notes, not folders')
    })
  })

  describe('when a correct listing pattern matches nothing', () => {
    it('says only that nothing matched when the pattern lists a folder', () => {
      const report = SearchReport.ofGlob('1 - Journal/Weekly/Week-35/*', NOTHING)

      expect(report).toBe('no notes match 1 - Journal/Weekly/Week-35/*')
    })

    it('says only that nothing matched when the pattern names an extension', () => {
      const report = SearchReport.ofGlob('1 - Journal/Weekly/Week-35/*.md', NOTHING)

      expect(report).toBe('no notes match 1 - Journal/Weekly/Week-35/*.md')
    })

    it('says only that nothing matched when the pattern crosses folders', () => {
      const report = SearchReport.ofGlob('1 - Journal/**', NOTHING)

      expect(report).toBe('no notes match 1 - Journal/**')
    })

    it('says only that nothing matched when the pattern names one note', () => {
      const report = SearchReport.ofGlob('Journal/08-28-Fri.md', NOTHING)

      expect(report).toBe('no notes match Journal/08-28-Fri.md')
    })
  })

  describe('when the glob matches notes', () => {
    it('lists the paths when notes match', () => {
      const report = SearchReport.ofGlob('Journal/*.md', new GlobResult(['Journal/a.md'], 1))

      expect(report).toBe('Journal/a.md')
    })
  })
})
