import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { OpenApproval } from '../open-approval'
import { TurnCancellation } from '../turn-cancellation'

const TODO = 'Journal/todo.md'

describe('OpenApproval', () => {
  let ask: Mock<[string], Promise<boolean>>

  beforeEach(() => {
    vi.clearAllMocks()
    ask = vi.fn().mockResolvedValue(true)
  })

  describe('when the question answers yes', () => {
    it('grants when the supplied question answers yes', async () => {
      expect(await OpenApproval.of(ask).grantFor(TODO)).toBe(true)
    })

    it('names the path in the question when an open is asked about', async () => {
      await OpenApproval.of(ask).grantFor(TODO)

      expect(ask).toHaveBeenCalledWith(TODO)
    })
  })

  describe('when the question answers no', () => {
    beforeEach(() => {
      ask.mockResolvedValue(false)
    })

    it('declines when the supplied question answers no', async () => {
      expect(await OpenApproval.of(ask).grantFor(TODO)).toBe(false)
    })

    it('asks again for the same path when the first answer declined', async () => {
      const approval = OpenApproval.of(ask)
      await approval.grantFor(TODO)

      await approval.grantFor(TODO)

      expect(ask).toHaveBeenCalledTimes(2)
    })
  })

  describe('when a path was already granted this turn', () => {
    let approval: OpenApproval

    beforeEach(async () => {
      approval = OpenApproval.of(ask)
      await approval.grantFor(TODO)
    })

    it('asks once for a path already granted this turn', async () => {
      await approval.grantFor(TODO)

      expect(ask).toHaveBeenCalledTimes(1)
    })

    it('grants a path already granted this turn', async () => {
      expect(await approval.grantFor(TODO)).toBe(true)
    })

    it('asks again for a different path, so one approval does not waive the next', async () => {
      await approval.grantFor('Lists/shopping.md')

      expect(ask).toHaveBeenCalledTimes(2)
    })
  })

  describe('when constructed granted, which is auto mode', () => {
    it('grants without asking when constructed granted', async () => {
      expect(await OpenApproval.granted().grantFor(TODO)).toBe(true)
    })
  })

  describe('when the turn is cancelled while the question waits', () => {
    let cancellation: TurnCancellation

    beforeEach(() => {
      cancellation = new TurnCancellation()
      ask.mockReturnValue(new Promise<boolean>(() => undefined))
    })

    it('declines when the turn is cancelled rather than answered', async () => {
      const granted = OpenApproval.of(ask, cancellation).grantFor(TODO)

      cancellation.cancel()

      expect(await granted).toBe(false)
    })

    it('settles rather than parking the loop when the turn is cancelled', async () => {
      const granted = OpenApproval.of(ask, cancellation).grantFor(TODO)

      cancellation.cancel()

      await expect(granted).resolves.toBeDefined()
    })
  })
})
