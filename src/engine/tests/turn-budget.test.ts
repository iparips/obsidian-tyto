import { beforeEach, describe, expect, it } from 'vitest'
import { TurnBudget } from '../models/turn-budget'

const TODO = 'Journal/todo.md'
const OTHER = 'Journal/other.md'

// One number bounds the cost of a turn, held by IterationBudget. What stays here
// is the open cap, which is about a turn writing to one note rather than about
// how long it takes.
describe('TurnBudget', () => {
  let budget: TurnBudget

  beforeEach(() => {
    budget = new TurnBudget()
  })

  describe('when nothing has opened', () => {
    it('allows the first note to open', () => {
      expect(budget.canOpen(TODO)).toBe(true)
    })
  })

  describe('when one note has opened', () => {
    beforeEach(() => {
      budget.takeOpen(TODO)
    })

    it('refuses a second, different note once the cap is reached', () => {
      expect(budget.canOpen(OTHER)).toBe(false)
    })

    // A command can move the target off the opened note without the model
    // choosing to, so returning to it must not cost a second open.
    it('allows the same note again, since returning is not a second note', () => {
      expect(budget.canOpen(TODO)).toBe(true)
    })

    it('names the cap when a second note is refused', () => {
      expect(TurnBudget.openCapMessage()).toBe(
        'this turn has already opened 1 note; edit that note rather than opening another',
      )
    })
  })
})
