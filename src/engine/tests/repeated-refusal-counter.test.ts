import { beforeEach, describe, expect, it } from 'vitest'
import { RepeatedRefusalCounter } from '../turn/repeated-refusal-counter'

const UNOPENED = 'todo.md was not opened this turn'
const UNCHOSEN = 'todo.md was not chosen by the user this turn'

describe('RepeatedRefusalCounter', () => {
  let repeatedRefusalCounter: RepeatedRefusalCounter

  beforeEach(() => {
    repeatedRefusalCounter = new RepeatedRefusalCounter()
  })

  describe('when the turn has not been refused', () => {
    it('reports itself unstuck when nothing was recorded', () => {
      expect(repeatedRefusalCounter.isStuck()).toBe(false)
    })

    it('reports itself unstuck when every call succeeded', () => {
      repeatedRefusalCounter.record(null)
      repeatedRefusalCounter.record(null)

      expect(repeatedRefusalCounter.isStuck()).toBe(false)
    })
  })

  describe('when the turn is refused once', () => {
    it('reports itself unstuck when one refusal has landed', () => {
      repeatedRefusalCounter.record(UNOPENED)

      expect(repeatedRefusalCounter.isStuck()).toBe(false)
    })
  })

  describe('when the same refusal repeats', () => {
    beforeEach(() => {
      repeatedRefusalCounter.record(UNOPENED)
      repeatedRefusalCounter.record(UNOPENED)
    })

    it('reports itself stuck when the same reason lands twice', () => {
      expect(repeatedRefusalCounter.isStuck()).toBe(true)
    })

    it('names the reason when it reports what stopped the turn', () => {
      expect(repeatedRefusalCounter.message()).toBe(
        'Owl was refused the same thing 2 times and stopped: todo.md was not opened this turn',
      )
    })
  })

  describe('when the repeatedRefusalCounter differ', () => {
    it('reports itself unstuck when a second reason replaces the first', () => {
      repeatedRefusalCounter.record(UNOPENED)

      repeatedRefusalCounter.record(UNCHOSEN)

      expect(repeatedRefusalCounter.isStuck()).toBe(false)
    })

    it('counts from the new reason when a third refusal repeats the second', () => {
      repeatedRefusalCounter.record(UNOPENED)
      repeatedRefusalCounter.record(UNCHOSEN)

      repeatedRefusalCounter.record(UNCHOSEN)

      expect(repeatedRefusalCounter.isStuck()).toBe(true)
    })
  })

  describe('when a call succeeds between repeatedRefusalCounter', () => {
    it('reports itself unstuck when progress separates two identical repeatedRefusalCounter', () => {
      repeatedRefusalCounter.record(UNOPENED)
      repeatedRefusalCounter.record(null)

      repeatedRefusalCounter.record(UNOPENED)

      expect(repeatedRefusalCounter.isStuck()).toBe(false)
    })
  })
})
