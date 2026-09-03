import { describe, expect, it } from 'vitest'
import { AnswerRequest } from '../models/answer-request'

describe('AnswerRequest', () => {
  describe('when no suggestions are offered', () => {
    it('carries the question text when a question is asked', () => {
      expect(new AnswerRequest('which list?').question).toBe('which list?')
    })

    it('carries no suggestions when none are offered', () => {
      expect(new AnswerRequest('which list?').suggestions).toEqual([])
    })
  })

  describe('when suggestions are offered', () => {
    it('carries the suggestions when some are offered', () => {
      expect(new AnswerRequest('which list?', ['Lists/a.md', 'Lists/b.md']).suggestions).toEqual([
        'Lists/a.md',
        'Lists/b.md',
      ])
    })
  })
})
