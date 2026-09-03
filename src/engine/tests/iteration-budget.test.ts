import { beforeEach, describe, expect, it } from 'vitest'
import { IterationBudget } from '../models/iteration-budget'

describe('IterationBudget', () => {
  let budget: IterationBudget

  beforeEach(() => {
    budget = new IterationBudget()
  })

  const spend = (times: number) => Array.from({ length: times }).forEach(() => budget.spend())

  describe('when the turn has room left', () => {
    it('is not spent when nothing has run', () => {
      expect(budget.isSpent()).toBe(false)
    })

    it('is not spent when one step short of the cap', () => {
      spend(9)

      expect(budget.isSpent()).toBe(false)
    })
  })

  describe('when the turn runs out', () => {
    it('is spent when the cap is reached', () => {
      spend(10)

      expect(budget.isSpent()).toBe(true)
    })
  })

  describe('when the turn is running low', () => {
    it('warns on the step that leaves three, so a cancel still has room', () => {
      spend(7)

      expect(budget.justRanLow()).toBe(true)
    })

    it('does not warn before the threshold', () => {
      spend(6)

      expect(budget.justRanLow()).toBe(false)
    })

    it('does not warn again after the threshold, so the panel gains one line', () => {
      spend(8)

      expect(budget.justRanLow()).toBe(false)
    })

    it('names how many steps are left when it warns', () => {
      spend(7)

      expect(budget.warning()).toBe('Owl is taking longer than usual: 3 steps left this turn.')
    })
  })
})
