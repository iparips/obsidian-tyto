import { describe, expect, it } from 'vitest'
import { RestoredText } from '../models/restored-text'

// The stamp's zone is the machine's, so the assertions bound it rather than
// naming one: a suite that names a zone fails on a machine in another.
describe('RestoredText', () => {
  describe('when the record says it was written', () => {
    it('names the day and time the session was last written', () => {
      const text = RestoredText.of(new Date(2026, 8, 11, 14, 32))

      expect(text.startsWith('Session restored from 2026-09-11 14:32 ')).toBe(true)
    })
  })

  describe('when the record carries no time', () => {
    it('reads without a stamp rather than guessing one', () => {
      expect(RestoredText.of(null)).toBe('Session restored.')
    })
  })
})
