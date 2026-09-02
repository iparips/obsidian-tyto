import { beforeEach, describe, expect, it } from 'vitest'
import { TurnBudget } from '../models/turn-budget'

describe('TurnBudget', () => {
  let budget: TurnBudget

  beforeEach(() => {
    budget = new TurnBudget()
  })

  describe('when commands are taken', () => {
    it('allows the command when the cap is not reached', () => {
      expect(budget.takeCommand()).toBe(true)
    })

    it('refuses the command when the cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeCommand())

      expect(budget.takeCommand()).toBe(false)
    })
  })

  describe('when searches are taken', () => {
    it('allows the search when the cap is not reached', () => {
      expect(budget.takeSearch()).toBe(true)
    })

    it('refuses the search when the cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeSearch())

      expect(budget.takeSearch()).toBe(false)
    })
  })

  describe('when one budget is spent', () => {
    it('leaves the search budget alone when the command cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeCommand())

      expect(budget.takeSearch()).toBe(true)
    })
  })
})
