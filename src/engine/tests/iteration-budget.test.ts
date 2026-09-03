import { beforeEach, describe, expect, it } from 'vitest'
import { IterationBudget } from '../models/iteration-budget'

describe('IterationBudget', () => {
  let budget: IterationBudget

  beforeEach(() => {
    budget = new IterationBudget()
  })

  const spend = (times: number) => Array.from({ length: times }).forEach(() => budget.spend())

  describe('when a reply batches several tool calls', () => {
    it('spends one step per call, so the count matches the steps list', () => {
      budget.spend(5)

      expect(budget.justRanLow()).toBe(false)
    })

    it('spends one step for a reply that called no tool', () => {
      budget.spend(0)

      expect(budget.isSpent()).toBe(false)
    })
  })

  describe('when the turn has room left', () => {
    it('is not spent when nothing has run', () => {
      expect(budget.isSpent()).toBe(false)
    })

    it('is not spent when one step short of the cap', () => {
      spend(19)

      expect(budget.isSpent()).toBe(false)
    })
  })

  describe('when the turn runs out', () => {
    it('is spent when the cap is reached', () => {
      spend(20)

      expect(budget.isSpent()).toBe(true)
    })
  })

  describe('when the turn is running low', () => {
    it('warns on the step that leaves three, so a cancel still has room', () => {
      spend(17)

      expect(budget.justRanLow()).toBe(true)
    })

    it('does not warn before the threshold', () => {
      spend(16)

      expect(budget.justRanLow()).toBe(false)
    })

    it('does not warn again after the threshold, so the panel gains one line', () => {
      spend(17)
      budget.justRanLow()

      spend(1)

      expect(budget.justRanLow()).toBe(false)
    })

    // A reply that batches several calls can jump past the threshold without
    // landing on it, and a turn that never warns is one the user cannot cancel
    // in time.
    it('warns when a batch crosses the threshold without landing on it', () => {
      budget.spend(18)

      expect(budget.justRanLow()).toBe(true)
    })

    it('names how many steps are left when it warns', () => {
      spend(17)

      expect(budget.warning()).toBe('Owl is taking longer than usual: 3 steps left this turn.')
    })
  })
})
