import { beforeEach, describe, expect, it } from 'vitest'
import { NoteReader } from '../note-reader'
import { FakeVault } from '../../test-support/fake-vault'

describe('NoteReader', () => {
  let vault: FakeVault

  beforeEach(() => {
    vault = new FakeVault()
  })

  const readerOf = () => new NoteReader(vault.asVault())

  describe('when the note exists', () => {
    beforeEach(() => {
      vault.withNote('Journal/day.md', '# Day\n\nthe roofing quote was 12k')
    })

    it('returns the full contents when the path names a note', async () => {
      const outcome = await readerOf().read('Journal/day.md')

      expect(outcome).toMatchObject({ value: '# Day\n\nthe roofing quote was 12k' })
    })

    it('reads through the vault cache when the path names a note', async () => {
      await readerOf().read('Journal/day.md')

      expect(vault.reads).toEqual(['Journal/day.md'])
    })
  })

  describe('when the note is missing', () => {
    it('returns a failure naming the path when no note is at it', async () => {
      const outcome = await readerOf().read('gone.md')

      expect(outcome).toMatchObject({ step: 'apply', message: 'no note at gone.md' })
    })

    it('fails rather than throwing when no note is at the path', async () => {
      const outcome = await readerOf().read('gone.md')

      expect(outcome.hasFailed()).toBe(true)
    })
  })
})
