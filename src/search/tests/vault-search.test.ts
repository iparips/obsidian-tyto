import { beforeEach, describe, expect, it } from 'vitest'
import { VaultSearch } from '../vault-search'
import { FakeVault } from '../../test-support/fake-vault'

const DAY_IN_MS = 24 * 60 * 60 * 1000

describe('VaultSearch', () => {
  let vault: FakeVault

  beforeEach(() => {
    vault = new FakeVault()
  })

  const searchOf = () => new VaultSearch(vault.asVault())

  describe('when notes match the query', () => {
    it('ranks a note matching twice above one matching once', async () => {
      vault.withNote('once.md', 'the roofing quote').withNote('twice.md', 'roofing and roofing')

      const hits = await searchOf().search('roofing')

      expect(hits.map((hit) => hit.path)).toEqual(['twice.md', 'once.md'])
    })

    it('returns the matching path when one note matches', async () => {
      vault.withNote('quote.md', 'the roofing quote').withNote('other.md', 'unrelated')

      const hits = await searchOf().search('roofing')

      expect(hits.map((hit) => hit.path)).toEqual(['quote.md'])
    })
  })

  describe('when no note matches the query', () => {
    it('returns an empty list when nothing matches', async () => {
      vault.withNote('other.md', 'unrelated')

      const hits = await searchOf().search('roofing')

      expect(hits).toEqual([])
    })
  })

  describe('when more notes match than the cap', () => {
    beforeEach(() => {
      Array.from({ length: 10 }).forEach((_, index) =>
        vault.withNote(`note-${index}.md`, 'roofing '.repeat(index + 1)),
      )
    })

    it('returns exactly the cap when more notes match', async () => {
      const hits = await searchOf().search('roofing')

      expect(hits).toHaveLength(8)
    })

    it('keeps the highest scoring notes when more notes match', async () => {
      const hits = await searchOf().search('roofing')

      expect(hits[0].path).toBe('note-9.md')
    })
  })

  describe('when a match sits inside a long note', () => {
    it('trims the excerpt around the match when the match is mid-note', async () => {
      vault.withNote('long.md', `${'a'.repeat(500)} roofing ${'b'.repeat(500)}`)

      const hits = await searchOf().search('roofing')

      expect(hits[0].excerpt).toMatch(/^\.\.\.a+ roofing b+\.\.\.$/)
    })

    it('does not underflow when the match sits at the start of the note', async () => {
      vault.withNote('start.md', `roofing ${'b'.repeat(500)}`)

      const hits = await searchOf().search('roofing')

      expect(hits[0].excerpt.startsWith('roofing')).toBe(true)
    })

    it('caps the excerpt length when the note is long', async () => {
      vault.withNote('long.md', `${'a'.repeat(500)} roofing ${'b'.repeat(500)}`)

      const hits = await searchOf().search('roofing')

      expect(hits[0].excerpt.length).toBeLessThanOrEqual(206)
    })
  })

  describe('when the query is narrowed by modification time', () => {
    beforeEach(() => {
      vault
        .withNote('fresh.md', 'roofing', Date.now() - DAY_IN_MS)
        .withNote('stale.md', 'roofing roofing roofing', Date.now() - 30 * DAY_IN_MS)
    })

    it('drops notes older than the window when a window is given', async () => {
      const hits = await searchOf().search('roofing', 7)

      expect(hits.map((hit) => hit.path)).toEqual(['fresh.md'])
    })

    it('keeps every note when no window is given', async () => {
      const hits = await searchOf().search('roofing')

      expect(hits.map((hit) => hit.path)).toEqual(['stale.md', 'fresh.md'])
    })
  })
})
