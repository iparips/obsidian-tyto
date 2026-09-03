import { beforeEach, describe, expect, it } from 'vitest'
import { SeenPaths } from '../models/seen-paths'
import { SearchHit } from '../models/search-hit'

const aHit = (path: string): SearchHit => new SearchHit(path, 1, 'excerpt')

describe('SeenPaths', () => {
  let seen: SeenPaths

  beforeEach(() => {
    seen = new SeenPaths()
  })

  describe('when nothing has been searched', () => {
    it('excludes every path when no search has run', () => {
      expect(seen.includes('note.md')).toBe(false)
    })
  })

  describe('when a search has returned hits', () => {
    beforeEach(() => {
      seen.record([aHit('Journal/todo.md'), aHit('Lists/shopping.md')])
    })

    it('includes a path when a search returned it', () => {
      expect(seen.includes('Journal/todo.md')).toBe(true)
    })

    it('excludes a path when no search returned it', () => {
      expect(seen.includes('Journal/other.md')).toBe(false)
    })
  })

  describe('when a second search refines the first', () => {
    beforeEach(() => {
      seen.record([aHit('Journal/todo.md')])
      seen.record([aHit('Lists/shopping.md')])
    })

    it('includes a path from the second search when a query is refined', () => {
      expect(seen.includes('Lists/shopping.md')).toBe(true)
    })

    it('keeps a path from the first search when a query is refined', () => {
      expect(seen.includes('Journal/todo.md')).toBe(true)
    })
  })
})
