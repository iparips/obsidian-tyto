import { beforeEach, describe, expect, it } from 'vitest'
import { IterationCounter } from '../turn/spending/iteration-counter'

describe('IterationCounter', () => {
  let counter: IterationCounter

  beforeEach(() => {
    counter = new IterationCounter()
  })

  const spend = (times: number) => Array.from({ length: times }).forEach(() => counter.spend())

  describe('when a reply batches several tool calls', () => {
    // A batch costs one round-trip however many calls it carries, so the calls
    // after the first are charged half. Asserted through isSpent, since what a
    // turn has left is the only thing the count is for.
    it('spends three for four calls, so batching leaves room to use what it found', () => {
      counter.spend(4)
      spend(16)

      expect(counter.isSpent()).toBe(false)
    })

    it('spends the four that four single calls would, once four more follow', () => {
      counter.spend(4)
      spend(17)

      expect(counter.isSpent()).toBe(true)
    })

    it('spends one for a single call, so an unbatched turn is charged as before', () => {
      counter.spend(1)
      spend(19)

      expect(counter.isSpent()).toBe(true)
    })

    // Rounded when read rather than as each batch lands: two replies of two
    // calls cost four, where rounding each would cost four and a half.
    it('keeps the fraction between batches rather than rounding each one', () => {
      counter.spend(2)
      counter.spend(2)
      spend(16)

      expect(counter.isSpent()).toBe(false)
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

    // The turn this change exists for: eleven replies carrying twenty calls
    // between them, which cost exactly twenty before and left nothing to read
    // the notes the last batch had just found.
    it('leaves room after the eleven batches that used to exhaust a turn', () => {
      ;[1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 4].forEach((calls) => counter.spend(calls))

      expect(counter.isSpent()).toBe(false)
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
    // in time. Reached from a turn already underway: a batch now costs half per
    // call after the first, so no batch a provider sends crosses from empty.
    it('warns when a batch crosses the threshold without landing on it', () => {
      spend(15)

      counter.spend(4)

      expect(counter.justRanLow()).toBe(true)
    })

    it('names how many steps are left when it warns', () => {
      spend(17)

      expect(counter.warning()).toBe('Tyto is taking longer than usual: 3 steps left this turn.')
    })
  })

  describe('when the running total is read', () => {
    it('reads zero before anything is spent', () => {
      expect(counter.spent()).toBe(0)
    })

    it('reads one after a single call', () => {
      counter.spend(1)

      expect(counter.spent()).toBe(1)
    })

    it('reads three after a batch of four, which is a round-trip and three halves', () => {
      counter.spend(4)

      expect(counter.spent()).toBe(3)
    })

    // Rounded once when read, so the total the transcript shows is the one the
    // exhausted message names rather than a sum of rounded steps.
    it('reads three after two batches of two, rather than the four rounding each would give', () => {
      counter.spend(2)
      counter.spend(2)

      expect(counter.spent()).toBe(3)
    })
  })

  describe('when the last charge is read', () => {
    it('charges zero before anything is spent, so an uncharged step reads as one', () => {
      expect(counter.chargeOfLastSpend()).toBe(0)
    })

    it('charges two and a half for a batch of four, which is what the budget line shows', () => {
      counter.spend(4)

      expect(counter.chargeOfLastSpend()).toBe(2.5)
    })

    it('charges one for a single call', () => {
      counter.spend(1)

      expect(counter.chargeOfLastSpend()).toBe(1)
    })

    it('charges one for a reply that sent no call, since a round-trip is a round-trip', () => {
      counter.spend(0)

      expect(counter.chargeOfLastSpend()).toBe(1)
    })

    it('charges the most recent spend rather than the total', () => {
      counter.spend(4)
      counter.spend(1)

      expect(counter.chargeOfLastSpend()).toBe(1)
    })
  })

  describe('when the user has set their own budget', () => {
    it('spends the budget it was given rather than the default', () => {
      counter = new IterationCounter(5)

      spend(5)

      expect(counter.isSpent()).toBe(true)
    })

    it('reports the budget it was given, which is what an exhausted turn names', () => {
      expect(new IterationCounter(5).max()).toBe(5)
    })
  })
})
