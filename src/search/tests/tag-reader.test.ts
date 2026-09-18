import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_TAG_RESULTS, TagReader } from '../tag-reader'
import { TagCount } from '../models/tag-count'
import { FakeVault } from '../../test-support/fake-vault'

const JOURNAL = '1 - Journal/Weekly/Week-35/04-09-Fri.md'
const QUOTE = 'Quotes/roofing.md'

describe('TagReader', () => {
  let vault: FakeVault

  beforeEach(() => {
    vault = new FakeVault().withNote(JOURNAL, 'friday').withNote(QUOTE, 'roofing')
  })

  const findTags = (filter: string | null = null) =>
    new TagReader(vault.asVault(), vault.asMetadataCache()).findTags(filter)

  describe('when notes carry tags', () => {
    it('returns each tag with the number of notes carrying it', () => {
      vault.withTags(JOURNAL, ['#health']).withTags(QUOTE, ['#health', '#roofing'])

      expect(findTags().tags).toEqual([new TagCount('#health', 2), new TagCount('#roofing', 1)])
    })

    it('counts a tag once for a note carrying it several times', () => {
      vault.withTags(JOURNAL, ['#health', '#health'])

      expect(findTags().tags).toEqual([new TagCount('#health', 1)])
    })

    it('counts a frontmatter tag and an inline tag as one tag', () => {
      vault.withTags(JOURNAL, ['health']).withTags(QUOTE, ['#health'])

      expect(findTags().tags).toEqual([new TagCount('#health', 2)])
    })

    it('returns a nested tag as its own row', () => {
      vault.withTags(JOURNAL, ['#project/tyto'])

      expect(findTags().tags).toEqual([new TagCount('#project/tyto', 1)])
    })

    it('leaves a nested tag out of its parent count', () => {
      vault.withTags(JOURNAL, ['#project/tyto']).withTags(QUOTE, ['#project'])

      expect(findTags().tags).toEqual([
        new TagCount('#project', 1),
        new TagCount('#project/tyto', 1),
      ])
    })

    it('orders the rows by count, most-used first', () => {
      vault.withTags(JOURNAL, ['#health', '#roofing']).withTags(QUOTE, ['#roofing'])

      expect(findTags().tags.map((row) => row.tag)).toEqual(['#roofing', '#health'])
    })

    it('orders equally used tags by name, so the order is stable', () => {
      vault.withTags(JOURNAL, ['#roofing']).withTags(QUOTE, ['#health'])

      expect(findTags().tags.map((row) => row.tag)).toEqual(['#health', '#roofing'])
    })

    it('reads no note contents, so a listing costs no read', () => {
      vault.withTags(JOURNAL, ['#health'])

      findTags()

      expect(vault.reads).toEqual([])
    })

    it('says nothing was trimmed when the rows fit', () => {
      vault.withTags(JOURNAL, ['#health'])

      expect(findTags().wasTrimmed()).toBe(false)
    })
  })

  describe('when a filter is given', () => {
    beforeEach(() => {
      vault.withTags(JOURNAL, ['#health', '#roofing']).withTags(QUOTE, ['#health'])
    })

    it('returns only the tags whose name contains the filter', () => {
      expect(findTags('roof').tags).toEqual([new TagCount('#roofing', 1)])
    })

    it('matches the filter without regard to case', () => {
      expect(findTags('ROOF').tags).toEqual([new TagCount('#roofing', 1)])
    })

    it('counts a filtered tag across the whole vault, not the filtered set', () => {
      expect(findTags('health').tags).toEqual([new TagCount('#health', 2)])
    })

    it('returns nothing when no tag contains the filter', () => {
      expect(findTags('gardening').tags).toEqual([])
    })

    it('counts the filtered rows as the total, so the trimmed line reads against them', () => {
      expect(findTags('roof').total).toBe(1)
    })
  })

  describe('when the vault has no tags', () => {
    it('returns no rows', () => {
      expect(findTags().tags).toEqual([])
    })

    it('counts nothing as the total', () => {
      expect(findTags().total).toBe(0)
    })
  })

  describe('when a note has no cache entry', () => {
    beforeEach(() => {
      vault.withUnindexedNote('Inbox/unindexed.md').withTags(QUOTE, ['#roofing'])
    })

    it('skips it rather than failing', () => {
      expect(() => findTags()).not.toThrow()
    })

    it('still counts the tags of the notes around it', () => {
      expect(findTags().tags).toEqual([new TagCount('#roofing', 1)])
    })
  })

  describe('when more tags exist than the cap', () => {
    beforeEach(() => {
      vault.withTags(JOURNAL, ['#health'])
      for (let index = 0; index < MAX_TAG_RESULTS; index++)
        vault.withNote(`Notes/${index}.md`, '').withTags(`Notes/${index}.md`, [`#tag-${index}`])
      vault.withTags(QUOTE, ['#health'])
    })

    it('caps the rows at the maximum', () => {
      expect(findTags().tags).toHaveLength(MAX_TAG_RESULTS)
    })

    it('says the cap trimmed the rows when it did', () => {
      expect(findTags().wasTrimmed()).toBe(true)
    })

    it('counts every matching tag as the total', () => {
      expect(findTags().total).toBe(MAX_TAG_RESULTS + 1)
    })

    it('keeps the most-used tags, since the cap follows the sort', () => {
      expect(findTags().tags[0]).toEqual(new TagCount('#health', 2))
    })
  })
})
