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

  describe('when opens are taken', () => {
    it('allows the open when the cap is not reached', () => {
      expect(budget.takeOpen()).toBe(true)
    })

    it('refuses the open when the cap is reached', () => {
      budget.takeOpen()

      expect(budget.takeOpen()).toBe(false)
    })
  })

  describe('when questions are taken', () => {
    it('allows the question when the cap is not reached', () => {
      expect(budget.takeQuestion()).toBe(true)
    })

    it('refuses the question when the cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeQuestion())

      expect(budget.takeQuestion()).toBe(false)
    })
  })

  describe('when one budget is spent', () => {
    it('leaves the search budget alone when the command cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeCommand())

      expect(budget.takeSearch()).toBe(true)
    })

    it('leaves the open budget alone when the command cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeCommand())

      expect(budget.takeOpen()).toBe(true)
    })

    it('leaves the command budget alone when the open cap is reached', () => {
      budget.takeOpen()

      expect(budget.takeCommand()).toBe(true)
    })

    it('leaves the question budget alone when the open cap is reached', () => {
      budget.takeOpen()

      expect(budget.takeQuestion()).toBe(true)
    })
  })

  describe('when the turn describes what it spent', () => {
    it('says nothing ran when no tool was called', () => {
      expect(budget.describeSpend()).toBe('no tools ran')
    })

    it('names the one kind spent when only searches ran', () => {
      Array.from({ length: 2 }).forEach(() => budget.takeSearch())

      expect(budget.describeSpend()).toBe('2 searches')
    })

    it('uses the singular when one of a kind ran', () => {
      budget.takeCommand()

      expect(budget.describeSpend()).toBe('1 command')
    })

    it('names every kind spent when several ran', () => {
      budget.takeCommand()
      budget.takeSearch()
      budget.takeOpen()
      budget.takeQuestion()

      expect(budget.describeSpend()).toBe('1 command, 1 search, 1 note opened, 1 question')
    })

    it('omits a kind that never ran, so the line names causes rather than caps', () => {
      budget.takeQuestion()

      expect(budget.describeSpend()).toBe('1 question')
    })
  })

  describe('when the turn reports which flows are spent', () => {
    it('spends nothing when no tool has run', () => {
      expect(budget.spentTools()).toEqual([])
    })

    it('names run_command when the command cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeCommand())

      expect(budget.spentTools()).toEqual(['run_command'])
    })

    it('names both search tools when the search cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeSearch())

      expect(budget.spentTools()).toEqual(['search_vault', 'read_note'])
    })

    it('names open_note when the open cap is reached', () => {
      budget.takeOpen()

      expect(budget.spentTools()).toEqual(['open_note'])
    })

    it('names ask_user when the question cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeQuestion())

      expect(budget.spentTools()).toEqual(['ask_user'])
    })

    it('leaves a flow unnamed while it still has room', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeSearch())

      expect(budget.spentTools()).toEqual([])
    })
  })
})
