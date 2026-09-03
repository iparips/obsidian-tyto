import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UserQuestion } from '../user-question'
import { AnswerRequest } from '../models/answer-request'
import { TurnCancellation } from '../turn-cancellation'

const WHICH_LIST = new AnswerRequest('which shopping list?', ['Lists/a.md', 'Lists/b.md'])

describe('UserQuestion', () => {
  let ask: Mock<[AnswerRequest], Promise<string>>

  beforeEach(() => {
    vi.clearAllMocks()
    ask = vi.fn().mockResolvedValue('the one in Lists')
  })

  describe('when the user answers', () => {
    it('returns the answer when one is given', async () => {
      expect(await UserQuestion.of(ask).answerTo(WHICH_LIST)).toBe('the one in Lists')
    })

    it('passes the question and its suggestions to whoever asks', async () => {
      await UserQuestion.of(ask).answerTo(WHICH_LIST)

      expect(ask).toHaveBeenCalledWith(WHICH_LIST)
    })

    it('asks again for a second question, so it holds nothing between them', async () => {
      const question = UserQuestion.of(ask)
      await question.answerTo(WHICH_LIST)

      await question.answerTo(WHICH_LIST)

      expect(ask).toHaveBeenCalledTimes(2)
    })
  })

  describe('when the turn is cancelled', () => {
    let cancellation: TurnCancellation

    beforeEach(() => {
      cancellation = new TurnCancellation()
      ask.mockReturnValue(new Promise<string>(() => undefined))
    })

    it('returns an empty answer when the turn is cancelled', async () => {
      const answer = UserQuestion.of(ask, cancellation).answerTo(WHICH_LIST)

      cancellation.cancel()

      expect(await answer).toBe('')
    })
  })

  describe('when nothing can answer', () => {
    it('returns an empty answer when constructed unanswered', async () => {
      expect(await UserQuestion.unanswered().answerTo(WHICH_LIST)).toBe('')
    })
  })
})
