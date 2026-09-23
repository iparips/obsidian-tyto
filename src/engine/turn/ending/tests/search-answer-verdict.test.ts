import { describe, expect, it } from 'vitest'
import { PathsReturnedByVaultRepository } from '../../paths-returned-by-vault-repository'
import { SearchAnswerVerdict } from '../search-answer-verdict'

const FOUND = '1 - Journal/Weekly/Week-35/04-09-Fri.md'

const pathsHolding = (...paths: string[]): PathsReturnedByVaultRepository => {
  const repository = new PathsReturnedByVaultRepository()
  repository.recordPaths(paths)
  return repository
}

describe('SearchAnswerVerdict', () => {
  describe('when no search returned a path', () => {
    it('needs no correcting, so a turn with nothing to cite still ends in text', () => {
      const verdict = SearchAnswerVerdict.onReply('Nothing matched', pathsHolding())

      expect(verdict.needsCorrecting()).toBe(false)
    })
  })

  describe('when a search returned a path and the reply names it uncited', () => {
    it('needs correcting', () => {
      const verdict = SearchAnswerVerdict.onReply(
        'The note is 1 - Journal/Weekly/Week-35/04-09-Fri.md',
        pathsHolding(FOUND),
      )

      expect(verdict.needsCorrecting()).toBe(true)
    })

    it('asks for the wikilink, since the citation is the smaller of the two mistakes', () => {
      const verdict = SearchAnswerVerdict.onReply(
        'The note is 1 - Journal/Weekly/Week-35/04-09-Fri.md',
        pathsHolding(FOUND),
      )

      expect(verdict.message()).toContain('without linking them')
    })
  })

  describe('when a search returned a path and the reply cites it correctly', () => {
    it('needs correcting, because the answer still went out as text', () => {
      const verdict = SearchAnswerVerdict.onReply(
        'The note is [[1 - Journal/Weekly/Week-35/04-09-Fri|04-09-Fri]]',
        pathsHolding(FOUND),
      )

      expect(verdict.needsCorrecting()).toBe(true)
    })

    it('asks for the tool rather than for a citation it already has', () => {
      const verdict = SearchAnswerVerdict.onReply(
        'The note is [[1 - Journal/Weekly/Week-35/04-09-Fri|04-09-Fri]]',
        pathsHolding(FOUND),
      )

      expect(verdict.message()).toContain('goes through answer_from_search')
    })
  })

  describe('when a search returned a path the reply never names', () => {
    it('needs correcting, since an answer about the vault goes through the tool', () => {
      const verdict = SearchAnswerVerdict.onReply('I could not tell', pathsHolding(FOUND))

      expect(verdict.needsCorrecting()).toBe(true)
    })
  })
})
