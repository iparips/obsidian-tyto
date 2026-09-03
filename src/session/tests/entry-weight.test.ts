import { describe, expect, it } from 'vitest'
import { EntryWeights } from '../models/entry-weight'

describe('EntryWeights', () => {
  describe('when the entry is what the user said', () => {})

  describe('when the entry asks the user which note they meant', () => {
    it('weighs a choice entry as a reply, not as context', () => {
      expect(EntryWeights.of('choice')).toBe('reply')
    })

    it('weighs a question entry as a reply, not as context', () => {
      expect(EntryWeights.of('question')).toBe('reply')
    })
  })

  describe('when the entry warns about the turn', () => {
    it('weighs a warning entry as context, so it does not compete with the reply', () => {
      expect(EntryWeights.of('warning')).toBe('context')
    })
  })

  describe('when the entry lists what the turn did', () => {
    it('weighs a steps entry as context, so it sits under the reply', () => {
      expect(EntryWeights.of('steps')).toBe('context')
    })
  })
})
