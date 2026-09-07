import { beforeEach, describe, expect, it } from 'vitest'
import { RepeatedRefusal } from '../turn/repeated-refusal'

const UNOPENED = 'todo.md was not opened this turn'
const UNCHOSEN = 'todo.md was not chosen by the user this turn'

describe('RepeatedRefusal', () => {
  let refusals: RepeatedRefusal

  beforeEach(() => {
    refusals = new RepeatedRefusal()
  })

  describe('when the turn has not been refused', () => {
    it('reports itself unstuck when nothing was recorded', () => {
      expect(refusals.isStuck()).toBe(false)
    })

    it('reports itself unstuck when every call succeeded', () => {
      refusals.record(null)
      refusals.record(null)

      expect(refusals.isStuck()).toBe(false)
    })
  })

  describe('when the turn is refused once', () => {
    it('reports itself unstuck when one refusal has landed', () => {
      refusals.record(UNOPENED)

      expect(refusals.isStuck()).toBe(false)
    })
  })

  describe('when the same refusal repeats', () => {
    beforeEach(() => {
      refusals.record(UNOPENED)
      refusals.record(UNOPENED)
    })

    it('reports itself stuck when the same reason lands twice', () => {
      expect(refusals.isStuck()).toBe(true)
    })

    it('names the reason when it reports what stopped the turn', () => {
      expect(refusals.message()).toBe(
        'Owl was refused the same thing 2 times and stopped: todo.md was not opened this turn',
      )
    })
  })

  describe('when the refusals differ', () => {
    it('reports itself unstuck when a second reason replaces the first', () => {
      refusals.record(UNOPENED)

      refusals.record(UNCHOSEN)

      expect(refusals.isStuck()).toBe(false)
    })

    it('counts from the new reason when a third refusal repeats the second', () => {
      refusals.record(UNOPENED)
      refusals.record(UNCHOSEN)

      refusals.record(UNCHOSEN)

      expect(refusals.isStuck()).toBe(true)
    })
  })

  describe('when a call succeeds between refusals', () => {
    it('reports itself unstuck when progress separates two identical refusals', () => {
      refusals.record(UNOPENED)
      refusals.record(null)

      refusals.record(UNOPENED)

      expect(refusals.isStuck()).toBe(false)
    })
  })
})
