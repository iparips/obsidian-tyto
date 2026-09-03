import { beforeEach, describe, expect, it } from 'vitest'
import { NoteGrep } from '../note-grep'
import { GrepRequest } from '../models/grep-request'
import { GrepResult } from '../models/grep-result'
import { ResultOrder } from '../models/result-order'
import { FakeVault } from '../../test-support/fake-vault'
import { Attempt } from '../../shared/models/outcome'

const QUOTE = 'Quotes/roofing.md'
const JOURNAL = '1 - Journal/Weekly/Week-35/04-09-Fri.md'

const valueOf = (outcome: Attempt<GrepResult>): GrepResult => {
  if (outcome.hasFailed()) throw new Error(outcome.message)
  return outcome.value
}

describe('NoteGrep', () => {
  let vault: FakeVault

  beforeEach(() => {
    vault = new FakeVault()
      .withNote(QUOTE, 'the roofing quote came to 12k', 100)
      .withNote(JOURNAL, 'called the roofing people, then the roofing supplier', 200)
      .withNote('Lists/shopping.md', 'milk and bread', 300)
  })

  const grepOf = () => new NoteGrep(vault.asVault())

  const find = (request: GrepRequest, sort?: string, order?: string) =>
    grepOf().find(request, ResultOrder.of(sort, order))

  const aRequest = (
    pattern: string,
    pathPattern: string | null = null,
    paths: readonly string[] = [],
    pathsOnly = false,
  ) => new GrepRequest(pattern, pathPattern, paths, pathsOnly)

  describe('when notes match the expression', () => {
    it('returns the notes whose contents match the expression', async () => {
      const result = valueOf(await find(aRequest('roofing')))

      expect(result.hits.map((hit) => hit.path)).toEqual([JOURNAL, QUOTE])
    })

    it('returns an excerpt around the match when excerpts are wanted', async () => {
      const result = valueOf(await find(aRequest('12k')))

      expect(result.hits[0].excerpt).toBe('the roofing quote came to 12k')
    })

    it('counts every match in a note, not only the first', async () => {
      const result = valueOf(await find(aRequest('roofing')))

      expect(result.hits.find((hit) => hit.path === JOURNAL)?.score).toBe(2)
    })

    it('matches whatever the case, so an upper-case pattern finds lower-case prose', async () => {
      const result = valueOf(await find(aRequest('Roofing')))

      expect(result.hits.map((hit) => hit.path)).toEqual([JOURNAL, QUOTE])
    })

    it('orders by match count when matches is asked for', async () => {
      const result = valueOf(await find(aRequest('roofing'), 'matches'))

      expect(result.hits.map((hit) => hit.path)).toEqual([JOURNAL, QUOTE])
    })

    it('orders by modification time when modified is asked for', async () => {
      const result = valueOf(await find(aRequest('roofing'), 'modified'))

      expect(result.hits.map((hit) => hit.path)).toEqual([JOURNAL, QUOTE])
    })
  })

  describe('when the match crosses a line break', () => {
    beforeEach(() => {
      vault.withNote('Prose/wrapped.md', 'the roofing\nquote arrived')
    })

    it('matches across a line break, since prose wraps and a sentence is one match', async () => {
      const result = valueOf(await find(aRequest('roofing\\s+quote', 'Prose/*.md')))

      expect(result.hits.map((hit) => hit.path)).toEqual(['Prose/wrapped.md'])
    })
  })

  describe('when paths alone are asked for', () => {
    it('returns no excerpt when paths alone are asked for', async () => {
      const result = valueOf(await find(aRequest('roofing', null, [], true)))

      expect(result.hits[0].excerpt).toBe('')
    })

    it('still returns the matching paths when paths alone are asked for', async () => {
      const result = valueOf(await find(aRequest('roofing', null, [], true)))

      expect(result.hits.map((hit) => hit.path)).toEqual([JOURNAL, QUOTE])
    })
  })

  describe('when a narrowing is given', () => {
    it('reads only the notes the path pattern admits, so narrowing costs no read', async () => {
      await find(aRequest('roofing', 'Quotes/*.md'))

      expect(vault.reads).toEqual([QUOTE])
    })

    it('reads only the notes the paths list names, when a list is given', async () => {
      await find(aRequest('roofing', null, [QUOTE]))

      expect(vault.reads).toEqual([QUOTE])
    })

    it('reads the notes both narrowings admit, when both are given', async () => {
      await find(aRequest('roofing', '**/*.md', [QUOTE]))

      expect(vault.reads).toEqual([QUOTE])
    })

    it('reads every note when neither narrowing is given', async () => {
      await find(aRequest('roofing'))

      expect(vault.reads).toHaveLength(3)
    })

    it('reads every note when the paths list is empty, so an empty list is no filter', async () => {
      await find(aRequest('roofing', null, []))

      expect(vault.reads).toHaveLength(3)
    })

    it('ignores a listed path with no note behind it, rather than failing', async () => {
      const result = valueOf(await find(aRequest('roofing', null, [QUOTE, 'Gone/away.md'])))

      expect(result.hits.map((hit) => hit.path)).toEqual([QUOTE])
    })
  })

  describe('when the narrowing admits no note', () => {
    it('says the narrowing admitted nothing, distinctly from finding no match', async () => {
      const result = valueOf(await find(aRequest('roofing', 'Nowhere/*.md')))

      expect(result.readNothing).toBe(true)
    })

    it('returns no hit when the narrowing admitted nothing', async () => {
      const result = valueOf(await find(aRequest('roofing', 'Nowhere/*.md')))

      expect(result.hits).toEqual([])
    })

    it('reads no note when the narrowing admitted nothing', async () => {
      await find(aRequest('roofing', 'Nowhere/*.md'))

      expect(vault.reads).toEqual([])
    })
  })

  describe('when the expression matches nothing', () => {
    it('returns an empty result when the expression matches nothing', async () => {
      const result = valueOf(await find(aRequest('plumbing')))

      expect(result.hits).toEqual([])
    })

    it('says the narrowing admitted notes, so an absent text reads apart from a wrong scope', async () => {
      const result = valueOf(await find(aRequest('plumbing')))

      expect(result.readNothing).toBe(false)
    })
  })

  describe('when the expression is invalid', () => {
    it('refuses an invalid expression by saying so, rather than failing the turn', async () => {
      const outcome = await find(aRequest('roofing('))

      expect(outcome.hasFailed()).toBe(true)
    })

    it('names the expression when it refuses an invalid one', async () => {
      const outcome = await find(aRequest('roofing('))

      expect(outcome.hasFailed() && outcome.message).toBe(
        'roofing( is not a valid regular expression',
      )
    })
  })

  describe('when more notes match than the cap', () => {
    beforeEach(() => {
      Array.from({ length: 15 }).forEach((_, index) =>
        vault.withNote(`Many/note-${String(index).padStart(3, '0')}.md`, 'roofing'),
      )
    })

    it('caps the results at ten when excerpts are wanted', async () => {
      const result = valueOf(await find(aRequest('roofing', 'Many/*.md')))

      expect(result.hits).toHaveLength(10)
    })

    it('counts every match as the total when the cap trimmed the rows', async () => {
      const result = valueOf(await find(aRequest('roofing', 'Many/*.md')))

      expect(result.total).toBe(15)
    })

    it('says the cap trimmed the results when it did', async () => {
      const result = valueOf(await find(aRequest('roofing', 'Many/*.md')))

      expect(result.wasTrimmed()).toBe(true)
    })

    it('caps the results at fifty when paths alone are asked for', async () => {
      const result = valueOf(await find(aRequest('roofing', 'Many/*.md', [], true)))

      expect(result.hits).toHaveLength(15)
    })
  })
})
