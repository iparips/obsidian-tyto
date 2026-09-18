import { describe, expect, it } from 'vitest'
import { ChatTurn } from '../models/chat-turn'
import { aToolCall } from '../../../test-support/builders'

describe('ChatTurn', () => {
  describe('when the reply carried calls and text', () => {
    it('holds both, so a reply carrying a sentence and a batch loses neither', () => {
      const call = aToolCall('grep_notes', { pattern: 'jon' })

      const turn = ChatTurn.ofToolCalls([call], 'Searching for that name now.')

      expect(turn.calls).toEqual([call])
      expect(turn.content).toBe('Searching for that name now.')
    })

    it('reads as tool calls rather than text, so the turn runs them rather than ending', () => {
      const turn = ChatTurn.ofToolCalls([aToolCall('grep_notes', {})], 'Searching now.')

      expect(turn.isToolCalls()).toBe(true)
      expect(turn.isText()).toBe(false)
    })
  })

  describe('when the reply carried calls alone', () => {
    it('holds an empty content, which is what every caller naming calls alone means', () => {
      const turn = ChatTurn.ofToolCalls([aToolCall('grep_notes', {})])

      expect(turn.content).toBe('')
    })
  })
})
