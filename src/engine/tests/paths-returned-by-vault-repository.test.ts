import { beforeEach, describe, expect, it } from 'vitest'
import { PathsReturnedByVaultRepository } from '../turn/paths-returned-by-vault-repository'
import { SearchHit } from '../../search/models/search-hit'

const aHit = (path: string): SearchHit => new SearchHit(path, 1, 'excerpt')

describe('PathsReturnedByVaultRepository', () => {
  let pathsReturnedByVault: PathsReturnedByVaultRepository

  beforeEach(() => {
    pathsReturnedByVault = new PathsReturnedByVaultRepository()
  })

  describe('when nothing has been searched', () => {
    it('excludes every path when no search has run', () => {
      expect(pathsReturnedByVault.includes('note.md')).toBe(false)
    })
  })

  describe('when a search has returned hits', () => {
    beforeEach(() => {
      pathsReturnedByVault.record([aHit('Journal/todo.md'), aHit('Lists/shopping.md')])
    })

    it('includes a path when a search returned it', () => {
      expect(pathsReturnedByVault.includes('Journal/todo.md')).toBe(true)
    })

    it('excludes a path when no search returned it', () => {
      expect(pathsReturnedByVault.includes('Journal/other.md')).toBe(false)
    })
  })

  describe('when a glob has returned paths', () => {
    beforeEach(() => {
      pathsReturnedByVault.recordPaths(['1 - Journal/Weekly/Week-35/04-09-Fri.md'])
    })

    it('includes a path when a glob returned it', () => {
      expect(pathsReturnedByVault.includes('1 - Journal/Weekly/Week-35/04-09-Fri.md')).toBe(true)
    })

    it('excludes a path when no glob returned it', () => {
      expect(pathsReturnedByVault.includes('1 - Journal/Weekly/Week-35/03-09-Thu.md')).toBe(false)
    })
  })

  describe('when a second search refines the first', () => {
    beforeEach(() => {
      pathsReturnedByVault.record([aHit('Journal/todo.md')])
      pathsReturnedByVault.record([aHit('Lists/shopping.md')])
    })

    it('includes a path from the second search when a query is refined', () => {
      expect(pathsReturnedByVault.includes('Lists/shopping.md')).toBe(true)
    })

    it('keeps a path from the first search when a query is refined', () => {
      expect(pathsReturnedByVault.includes('Journal/todo.md')).toBe(true)
    })
  })
})
