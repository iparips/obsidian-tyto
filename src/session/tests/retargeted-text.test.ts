import { describe, expect, it } from 'vitest'
import { RetargetedText } from '../models/retargeted-text'

describe('RetargetedText', () => {
  describe('when the session moved to a note', () => {
    it('names the note rather than its path, as the header does', () => {
      expect(RetargetedText.of('Lists/todo.md')).toBe('Now editing todo.')
    })
  })

  describe('when the session moved to a tab holding no note', () => {
    it('says the binding went rather than naming a path it does not have', () => {
      expect(RetargetedText.of(null)).toBe('No note is bound to this session.')
    })
  })
})
