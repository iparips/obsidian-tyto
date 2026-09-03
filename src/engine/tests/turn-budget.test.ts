import { beforeEach, describe, expect, it } from 'vitest'
import { TurnBudget } from '../models/turn-budget'

const NOTE = 'Lists/todo.md'
const OTHER = 'Lists/shopping.md'

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

  describe('when globs are taken', () => {
    it('allows the glob when the cap is not reached', () => {
      expect(budget.takeGlob()).toBe(true)
    })

    it('refuses the glob when the cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeGlob())

      expect(budget.takeGlob()).toBe(false)
    })
  })

  describe('when greps are taken', () => {
    it('allows the grep when the cap is not reached', () => {
      expect(budget.takeGrep()).toBe(true)
    })

    it('refuses the grep when the cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeGrep())

      expect(budget.takeGrep()).toBe(false)
    })
  })

  describe('when opens are taken', () => {
    it('allows the open when the cap is not reached', () => {
      expect(budget.canOpen(NOTE)).toBe(true)
    })

    it('refuses a second note when the cap is reached', () => {
      budget.takeOpen(NOTE)

      expect(budget.canOpen(OTHER)).toBe(false)
    })

    it('allows reopening the same note, since returning to it is not a second note', () => {
      budget.takeOpen(NOTE)

      expect(budget.canOpen(NOTE)).toBe(true)
    })

    // The user declining a note must not cost the turn its one open, so asking
    // and spending are separate.
    it('leaves a second note open when the first was asked about but never taken', () => {
      budget.canOpen(NOTE)

      expect(budget.canOpen(OTHER)).toBe(true)
    })

    it('counts a reopened note once, so the spend names one note opened', () => {
      budget.takeOpen(NOTE)
      budget.takeOpen(NOTE)

      expect(budget.describeSpend()).toBe('1 note opened')
    })

    it('leaves open_note offered while the same note can still be reopened', () => {
      budget.takeOpen(NOTE)

      expect(budget.spentTools()).toEqual([])
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

      expect(budget.canOpen(NOTE)).toBe(true)
    })

    it('leaves the grep budget alone when the glob cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeGlob())

      expect(budget.takeGrep()).toBe(true)
    })

    it('leaves the glob budget alone when the grep cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeGrep())

      expect(budget.takeGlob()).toBe(true)
    })

    it('leaves the command budget alone when the open cap is reached', () => {
      budget.takeOpen(NOTE)

      expect(budget.takeCommand()).toBe(true)
    })

    it('leaves the question budget alone when the open cap is reached', () => {
      budget.takeOpen(NOTE)

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
      budget.takeGlob()
      budget.takeGrep()
      budget.takeOpen(NOTE)
      budget.takeQuestion()

      expect(budget.describeSpend()).toBe(
        '1 command, 1 search, 1 listing, 1 text search, 1 note opened, 1 question',
      )
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

    it('names read_note when the search cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeSearch())

      expect(budget.spentTools()).toEqual(['read_note'])
    })

    it('names glob_notes when the glob cap is reached', () => {
      Array.from({ length: 3 }).forEach(() => budget.takeGlob())

      expect(budget.spentTools()).toEqual(['glob_notes'])
    })

    it('names grep_notes when the grep cap is reached', () => {
      Array.from({ length: 4 }).forEach(() => budget.takeGrep())

      expect(budget.spentTools()).toEqual(['grep_notes'])
    })

    it('names open_note nowhere, since the note opened can always be reopened', () => {
      budget.takeOpen(NOTE)

      expect(budget.spentTools()).toEqual([])
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
