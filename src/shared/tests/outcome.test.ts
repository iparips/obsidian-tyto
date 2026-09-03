import { describe, expect, it } from 'vitest'
import { Outcomes } from '../models/outcome'

describe('Outcomes', () => {
  describe('when the outcome is a success', () => {
    it('reports itself succeeded', () => {
      expect(Outcomes.success('done').succeeded()).toBe(true)
    })

    it('reports itself not cancelled', () => {
      expect(Outcomes.success('done').wasCancelled()).toBe(false)
    })
  })

  describe('when the outcome is a failure', () => {
    it('reports itself failed', () => {
      expect(Outcomes.failure('chat', 'model unavailable').hasFailed()).toBe(true)
    })

    it('reports itself not cancelled', () => {
      expect(Outcomes.failure('chat', 'model unavailable').wasCancelled()).toBe(false)
    })
  })

  describe('when the outcome is a cancellation', () => {
    it('reports itself cancelled', () => {
      expect(Outcomes.cancelled('chat').wasCancelled()).toBe(true)
    })

    it('reports itself not failed, so a cancel is not an error', () => {
      expect(Outcomes.cancelled('chat').hasFailed()).toBe(false)
    })

    it('reports itself not succeeded', () => {
      expect(Outcomes.cancelled('chat').succeeded()).toBe(false)
    })

    it('holds the notes the turn wrote before it stopped', () => {
      expect(Outcomes.cancelled('chat', ['note.md']).writtenNotes).toEqual(['note.md'])
    })

    it('holds no note when the turn wrote nothing', () => {
      expect(Outcomes.cancelled('chat').writtenNotes).toEqual([])
    })
  })

  describe('when an outcome is relayed', () => {
    it('keeps the step and the message when the outcome failed', () => {
      const relayed = Outcomes.relay(Outcomes.failure('apply', 'note.md is not open'))

      expect(relayed).toEqual(Outcomes.failure('apply', 'note.md is not open'))
    })

    it('keeps the written notes when the outcome was cancelled', () => {
      const relayed = Outcomes.relay(Outcomes.cancelled('chat', ['note.md']))

      expect(relayed).toEqual(Outcomes.cancelled('chat', ['note.md']))
    })
  })
})
