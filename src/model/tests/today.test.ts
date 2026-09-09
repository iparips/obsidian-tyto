import { describe, expect, it } from 'vitest'
import { Today } from '../today'

describe('Today', () => {
  describe('when the date is described', () => {
    it('gives the ISO date and the weekday when a date is supplied', () => {
      expect(new Today(new Date(2026, 8, 3)).describe()).toBe('2026-09-03 (Thursday)')
    })

    it('pads a single-digit month and day, so the form matches a dated note name', () => {
      expect(new Today(new Date(2026, 0, 5)).describe()).toBe('2026-01-05 (Monday)')
    })

    it('reads the local date rather than UTC, so a late evening is not tomorrow', () => {
      expect(new Today(new Date(2026, 8, 3, 23, 30)).describe()).toBe('2026-09-03 (Thursday)')
    })
  })

  // The vault's folders are ISO week numbers, and the model was never told the
  // current one: mapping a date onto Week-36 was a second derivation on a first.
  describe('when the week is described', () => {
    it('names the week number and the Monday it began for a mid-week date', () => {
      expect(new Today(new Date(2026, 8, 9)).describeWithWeek()).toBe(
        '2026-09-09 (Wednesday), in week 37, which began Monday 2026-09-07',
      )
    })

    it('keeps a Sunday in the week that began six days earlier, since ISO weeks end there', () => {
      expect(new Today(new Date(2026, 8, 6)).describeWithWeek()).toBe(
        '2026-09-06 (Sunday), in week 36, which began Monday 2026-08-31',
      )
    })

    it('counts a Monday as the first day of its own week', () => {
      expect(new Today(new Date(2026, 8, 7)).describeWithWeek()).toBe(
        '2026-09-07 (Monday), in week 37, which began Monday 2026-09-07',
      )
    })

    // 2027-01-01 is a Friday, so ISO puts it in the last week of 2026.
    it('gives a January date the previous years week number when ISO says so', () => {
      expect(new Today(new Date(2027, 0, 1)).describeWithWeek()).toBe(
        '2027-01-01 (Friday), in week 53, which began Monday 2026-12-28',
      )
    })

    it('leaves describe unchanged, so the plain date has no week on it', () => {
      expect(new Today(new Date(2026, 8, 9)).describe()).toBe('2026-09-09 (Wednesday)')
    })
  })

  describe('when no date is supplied', () => {
    it('describes the current date when built with no clock', () => {
      expect(Today.of().describe()).toMatch(/^\d{4}-\d{2}-\d{2} \([A-Z][a-z]+\)$/)
    })
  })
})
