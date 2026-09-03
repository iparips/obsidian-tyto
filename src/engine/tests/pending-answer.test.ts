import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { PendingAnswer } from '../pending-answer'
import { AnswerRequest } from '../models/answer-request'
import { TurnCancellation } from '../turn-cancellation'

describe('PendingAnswer', () => {
  let cancellation: TurnCancellation
  let ask: Mock<[AnswerRequest], Promise<string>>

  beforeEach(() => {
    vi.clearAllMocks()
    cancellation = new TurnCancellation()
    ask = vi.fn()
  })

  const parked = () => new PendingAnswer(ask, cancellation)

  describe('when the panel answers', () => {
    beforeEach(() => {
      ask.mockResolvedValue('the shopping list')
    })

    it('resolves with the answer when the panel answers', async () => {
      expect(await parked().awaiting(new AnswerRequest('which list?'), '')).toBe(
        'the shopping list',
      )
    })

    it('passes the question and its suggestions to whoever asks', async () => {
      const request = new AnswerRequest('which list?', ['a', 'b'])

      await parked().awaiting(request, '')

      expect(ask).toHaveBeenCalledWith(request)
    })
  })

  describe('when the turn is cancelled instead', () => {
    beforeEach(() => {
      ask.mockReturnValue(new Promise<string>(() => undefined))
    })

    it('resolves with the fallback when the turn is cancelled', async () => {
      const answer = parked().awaiting(new AnswerRequest('which list?'), 'nothing')

      cancellation.cancel()

      expect(await answer).toBe('nothing')
    })

    it('resolves with the fallback when the turn was already cancelled', async () => {
      cancellation.cancel()

      expect(await parked().awaiting(new AnswerRequest('which list?'), 'nothing')).toBe('nothing')
    })
  })

  describe('when an answer and a cancellation arrive together', () => {
    it('resolves once when both an answer and a cancellation arrive', async () => {
      ask.mockResolvedValue('the shopping list')

      const answer = parked().awaiting(new AnswerRequest('which list?'), 'nothing')
      cancellation.cancel()

      expect(['the shopping list', 'nothing']).toContain(await answer)
    })

    it('settles rather than parking when both an answer and a cancellation arrive', async () => {
      ask.mockResolvedValue('the shopping list')

      const answer = parked().awaiting(new AnswerRequest('which list?'), 'nothing')
      cancellation.cancel()

      await expect(answer).resolves.toBeDefined()
    })
  })
})
