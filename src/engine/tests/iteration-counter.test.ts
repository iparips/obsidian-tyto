import { beforeEach, describe, expect, it } from 'vitest'
import { IterationCounter } from '../turn/spending/iteration-counter'

describe('IterationCounter', () => {
  let counter: IterationCounter

  beforeEach(() => {
    counter = new IterationCounter()
  })

  const spend = (times: number) => Array.from({ length: times }).forEach(() => counter.spend())

  describe('when a reply batches several tool calls', () => {
    it('spends one step per call, so the count matches the steps list', () => {
      counter.spend(5)

      expect(counter.justRanLow()).toBe(false)
    })

    it('spends one step for a reply that called no tool', () => {
      counter.spend(0)

      expect(counter.isSpent()).toBe(false)
    })
  })

  describe('when the turn has room left', () => {
    it('is not spent when nothing has run', () => {
      expect(counter.isSpent()).toBe(false)
    })

    it('is not spent when one step short of the cap', () => {
      spend(19)

      expect(counter.isSpent()).toBe(false)
    })
  })

  describe('when the turn runs out', () => {
    it('is spent when the cap is reached', () => {
      spend(20)

      expect(counter.isSpent()).toBe(true)
    })
  })

  describe('when the turn is running low', () => {
    it('warns on the step that leaves three, so a cancel still has room', () => {
      spend(17)

      expect(counter.justRanLow()).toBe(true)
    })

    it('does not warn before the threshold', () => {
      spend(16)

      expect(counter.justRanLow()).toBe(false)
    })

    it('does not warn again after the threshold, so the panel gains one line', () => {
      spend(17)
      counter.justRanLow()

      spend(1)

      expect(counter.justRanLow()).toBe(false)
    })

    // A reply that batches several calls can jump past the threshold without
    // landing on it, and a turn that never warns is one the user cannot cancel
    // in time.
    it('warns when a batch crosses the threshold without landing on it', () => {
      counter.spend(18)

      expect(counter.justRanLow()).toBe(true)
    })

    it('names how many steps are left when it warns', () => {
      spend(17)

      expect(counter.warning()).toBe('Tyto is taking longer than usual: 3 steps left this turn.')
    })
  })
})
