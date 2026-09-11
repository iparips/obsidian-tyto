import { describe, expect, it } from 'vitest'
import { ResolvedDate } from '../resolved-date'

describe('ResolvedDate', () => {
  describe('when the date is described', () => {
    it('names the phrase, the date, the weekday, the week and the Monday it began', () => {
      expect(new ResolvedDate('last Friday', new Date(2026, 8, 4)).describe()).toBe(
        '"last Friday" is 2026-09-04 (Friday), in week 36, which began Monday 2026-08-31.',
      )
    })

    // 2027-01-01 is a Friday, so ISO puts it in the last week of 2026. The
    // model globs a Week-53 folder for it, not a Week-1 one.
    it('gives a January date the previous years week when ISO says the week began there', () => {
      expect(new ResolvedDate('new years day', new Date(2027, 0, 1)).describe()).toBe(
        '"new years day" is 2027-01-01 (Friday), in week 53, which began Monday 2026-12-28.',
      )
    })
  })

  describe('when the date alone is read', () => {
    it('gives the ISO date without the week around it', () => {
      expect(new ResolvedDate('last Friday', new Date(2026, 8, 4)).isoDate()).toBe('2026-09-04')
    })
  })
})
