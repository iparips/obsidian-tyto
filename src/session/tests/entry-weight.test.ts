import { describe, expect, it } from 'vitest'
import { EntryWeights } from '../models/entry-weight'

describe('EntryWeights', () => {
  describe('when the entry is what the user said', () => {
    it('weighs a user entry as an utterance', () => {
      expect(EntryWeights.of('user')).toBe('utterance')
    })
  })

  describe('when the entry is what the turn produced', () => {
    it('weighs an assistant entry as a reply', () => {
      expect(EntryWeights.of('assistant')).toBe('reply')
    })

    it('weighs an answer entry as a reply', () => {
      expect(EntryWeights.of('answer')).toBe('reply')
    })

    it('weighs an error entry as a reply', () => {
      expect(EntryWeights.of('error')).toBe('reply')
    })
  })

  describe('when the entry is what the harness did', () => {
    it('weighs an instructions entry as context', () => {
      expect(EntryWeights.of('instructions')).toBe('context')
    })

    it('weighs a command entry as context', () => {
      expect(EntryWeights.of('command')).toBe('context')
    })
  })

  describe('when the entry asks the user to approve a note', () => {
    it('weighs a confirm entry as a reply, not as context', () => {
      expect(EntryWeights.of('confirm')).toBe('reply')
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
