import { describe, expect, it } from 'vitest'
import { LocalTimestamp } from '../models/local-timestamp'

// The zone is the machine's, so these assert the shape around it rather than a
// literal: a suite that names one zone fails on a machine in another.
describe('LocalTimestamp', () => {
  describe('when a time is stamped', () => {
    it('pads a single-digit month, day, hour and minute to a fixed width', () => {
      const stamp = LocalTimestamp.of(new Date(2026, 0, 5, 9, 7))

      expect(stamp.startsWith('2026-01-05 09:07 ')).toBe(true)
    })

    it('names a zone, so a session read after moving says where it was had', () => {
      const stamp = LocalTimestamp.of(new Date(2026, 8, 11, 14, 32))

      expect(stamp.slice('2026-09-11 14:32 '.length).length).toBeGreaterThan(0)
    })
  })
})
