import { describe, expect, it } from 'vitest'
import { Today } from '../models/today'

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

  describe('when no date is supplied', () => {
    it('describes the current date when built with no clock', () => {
      expect(Today.of().describe()).toMatch(/^\d{4}-\d{2}-\d{2} \([A-Z][a-z]+\)$/)
    })
  })
})
