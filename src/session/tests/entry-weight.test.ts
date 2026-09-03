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
})
