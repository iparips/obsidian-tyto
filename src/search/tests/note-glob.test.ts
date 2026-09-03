import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_GLOB_RESULTS, NoteGlob } from '../note-glob'
import { ResultOrder } from '../models/result-order'
import { FakeVault } from '../../test-support/fake-vault'

const WEEK = '1 - Journal/Weekly/Week-35'
const FRIDAY = `${WEEK}/04-09-Fri.md`
const THURSDAY = `${WEEK}/03-09-Thu.md`

describe('NoteGlob', () => {
  let vault: FakeVault

  beforeEach(() => {
    vault = new FakeVault().withNote(FRIDAY, 'friday', 200).withNote(THURSDAY, 'thursday', 300)
  })

  const globOf = () => new NoteGlob(vault.asVault())

  const find = (pattern: string, sort?: string, order?: string) =>
    globOf().find(pattern, ResultOrder.of(sort, order))

  describe('when notes match the pattern', () => {
    it('returns the notes matching the pattern', () => {
      vault.withNote('Quotes/roofing.md', 'roofing')

      expect(find(`${WEEK}/*.md`).paths).toEqual([THURSDAY, FRIDAY])
    })

    it('returns them in path order when nothing is asked for', () => {
      expect(find('**/*.md').paths).toEqual([THURSDAY, FRIDAY])
    })

    it('returns the newest first when modified is asked for', () => {
      expect(find('**/*.md', 'modified').paths).toEqual([THURSDAY, FRIDAY])
    })

    it('reads no note contents, so a listing costs no read', () => {
      find('**/*.md')

      expect(vault.reads).toEqual([])
    })

    it('says nothing was trimmed when the results fit', () => {
      expect(find('**/*.md').wasTrimmed()).toBe(false)
    })

    it('counts every match as the total when the results fit', () => {
      expect(find('**/*.md').total).toBe(2)
    })
  })

  describe('when nothing matches the pattern', () => {
    it('returns an empty result when nothing matches, rather than failing', () => {
      expect(find('Nowhere/*.md').paths).toEqual([])
    })

    it('counts nothing as the total when nothing matches', () => {
      expect(find('Nowhere/*.md').total).toBe(0)
    })
  })

  describe('when more notes match than the cap', () => {
    beforeEach(() => {
      Array.from({ length: MAX_GLOB_RESULTS + 5 }).forEach((_, index) =>
        vault.withNote(`Many/note-${String(index).padStart(3, '0')}.md`, 'body'),
      )
    })

    it('caps the results when more notes match than the cap', () => {
      expect(find('Many/*.md').paths).toHaveLength(MAX_GLOB_RESULTS)
    })

    it('says the cap trimmed the results when it did', () => {
      expect(find('Many/*.md').wasTrimmed()).toBe(true)
    })

    it('counts every match as the total when the cap trimmed the rows', () => {
      expect(find('Many/*.md').total).toBe(MAX_GLOB_RESULTS + 5)
    })
  })
})
