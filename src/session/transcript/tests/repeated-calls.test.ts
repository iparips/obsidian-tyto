import { describe, expect, it } from 'vitest'
import { ToolCall } from '../../../model/providers/types'
import { CallsOfStep, RepeatedCalls } from '../repeated-calls'

describe('RepeatedCalls', () => {
  const aGrep = (id: string, pattern: string) => new ToolCall(id, 'grep_notes', { pattern })

  const stepOf = (step: number, call: ToolCall, result: string) =>
    new CallsOfStep(step, [call], new Map([[call.id, result]]))

  describe('when a turn sent the same call three times, each returning nothing', () => {
    const first = aGrep('c1', 'jon')
    const second = aGrep('c2', 'jon')
    const third = aGrep('c3', 'jon')

    const repeats = () =>
      RepeatedCalls.of([
        stepOf(0, first, 'nothing matched'),
        stepOf(1, second, 'nothing matched'),
        stepOf(2, third, 'nothing matched'),
      ])

    it('leaves the first unmarked', () => {
      expect(repeats().repeatedStepOf(first)).toBeNull()
    })

    it('marks the second as repeating the first', () => {
      expect(repeats().repeatedStepOf(second)).toBe(0)
    })

    it('marks the third as repeating the first, not the second', () => {
      expect(repeats().repeatedStepOf(third)).toBe(0)
    })
  })

  describe('when the turn changed what the call reads', () => {
    // A grep that missed, a write, and the same grep hitting is one turn doing
    // its job: marking the second would report the step that did the most work
    // as the step that went nowhere.
    it('marks neither grep when the second returned what the first did not', () => {
      const missed = aGrep('c1', 'jon')
      const hit = aGrep('c2', 'jon')

      const repeats = RepeatedCalls.of([
        stepOf(0, missed, 'nothing matched'),
        stepOf(1, hit, 'day.md (1 match): jon'),
      ])

      expect(repeats.repeatedStepOf(missed)).toBeNull()
      expect(repeats.repeatedStepOf(hit)).toBeNull()
    })
  })

  describe('when the calls differ', () => {
    it('marks neither when the same tool was sent with different arguments', () => {
      const jon = aGrep('c1', 'jon')
      const john = aGrep('c2', 'john')

      const repeats = RepeatedCalls.of([
        stepOf(0, jon, 'nothing matched'),
        stepOf(1, john, 'nothing matched'),
      ])

      expect(repeats.repeatedStepOf(john)).toBeNull()
    })

    it('marks neither when different tools carried identical arguments', () => {
      const grep = new ToolCall('c1', 'grep_notes', { pattern: 'jon' })
      const glob = new ToolCall('c2', 'glob_notes', { pattern: 'jon' })

      const repeats = RepeatedCalls.of([
        stepOf(0, grep, 'nothing matched'),
        stepOf(1, glob, 'nothing matched'),
      ])

      expect(repeats.repeatedStepOf(glob)).toBeNull()
    })
  })

  describe('when a result is missing from the history', () => {
    it('marks nothing, since the same-result test cannot be met by an absence', () => {
      const first = aGrep('c1', 'jon')
      const second = aGrep('c2', 'jon')

      const repeats = RepeatedCalls.of([
        new CallsOfStep(0, [first], new Map()),
        new CallsOfStep(1, [second], new Map()),
      ])

      expect(repeats.repeatedStepOf(second)).toBeNull()
    })
  })

  // The window is the turn, so a section builds its own RepeatedCalls and a
  // call sent in two turns is answering two utterances rather than looping.
  describe('when two turns each sent the same call', () => {
    it('marks neither, since each turn is judged on its own steps', () => {
      const inTurnOne = aGrep('c1', 'jon')
      const inTurnTwo = aGrep('c2', 'jon')

      const turnTwo = RepeatedCalls.of([stepOf(0, inTurnTwo, 'nothing matched')])

      expect(
        RepeatedCalls.of([stepOf(0, inTurnOne, 'nothing matched')]).repeatedStepOf(inTurnOne),
      ).toBeNull()
      expect(turnTwo.repeatedStepOf(inTurnTwo)).toBeNull()
    })
  })

  describe('when the call was never sent', () => {
    it('answers null for a call the turn does not hold', () => {
      const repeats = RepeatedCalls.of([stepOf(0, aGrep('c1', 'jon'), 'nothing matched')])

      expect(repeats.repeatedStepOf(aGrep('c9', 'jon'))).toBeNull()
    })
  })
})
