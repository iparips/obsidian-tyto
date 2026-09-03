import { describe, expect, it } from 'vitest'
import { ResultOrder, SortKeys } from '../models/result-order'

interface Row {
  path: string
  modified: number
  matches: number
}

const ROWS: Row[] = [
  { path: 'b.md', modified: 300, matches: 1 },
  { path: 'a.md', modified: 100, matches: 3 },
  { path: 'c.md', modified: 200, matches: 2 },
]

const ALL_KEYS: SortKeys<Row> = {
  path: (row) => row.path,
  modified: (row) => row.modified,
  matches: (row) => row.matches,
}

const PATH_ONLY: SortKeys<Row> = { path: (row) => row.path }

const pathsOf = (sort?: string, order?: string, keys: SortKeys<Row> = ALL_KEYS): string[] =>
  ResultOrder.of(sort, order)
    .sorted(ROWS, keys)
    .map((row) => row.path)

describe('ResultOrder', () => {
  describe('when nothing is asked for', () => {
    it('orders by path ascending when no field is asked for', () => {
      expect(pathsOf()).toEqual(['a.md', 'b.md', 'c.md'])
    })
  })

  describe('when a field is asked for', () => {
    it('orders by path when path is asked for', () => {
      expect(pathsOf('path')).toEqual(['a.md', 'b.md', 'c.md'])
    })

    it('orders by modified descending when modified is asked for, so newest is first', () => {
      expect(pathsOf('modified')).toEqual(['b.md', 'c.md', 'a.md'])
    })

    it('orders by matches descending when matches is asked for', () => {
      expect(pathsOf('matches')).toEqual(['a.md', 'c.md', 'b.md'])
    })
  })

  describe('when a direction is asked for', () => {
    it('orders modified ascending when ascending is asked for', () => {
      expect(pathsOf('modified', 'ascending')).toEqual(['a.md', 'c.md', 'b.md'])
    })

    it('orders path descending when descending is asked for', () => {
      expect(pathsOf('path', 'descending')).toEqual(['c.md', 'b.md', 'a.md'])
    })
  })

  describe('when the request is not recognised', () => {
    it('falls back to path when the sort field is not recognised', () => {
      expect(pathsOf('relevance')).toEqual(['a.md', 'b.md', 'c.md'])
    })

    it("falls back to the field's own default when the direction is not recognised", () => {
      expect(pathsOf('modified', 'newest')).toEqual(['b.md', 'c.md', 'a.md'])
    })
  })

  describe('when the caller offers no key for the field', () => {
    it('falls back to path when the caller supplied no key for the field', () => {
      expect(pathsOf('matches', 'ascending', PATH_ONLY)).toEqual(['a.md', 'b.md', 'c.md'])
    })
  })
})
