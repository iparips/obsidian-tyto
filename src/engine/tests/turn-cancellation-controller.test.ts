import { beforeEach, describe, expect, it } from 'vitest'
import { TurnCancellationController } from '../turn/turn-cancellation-controller'

describe('TurnCancellationController', () => {
  let cancellationController: TurnCancellationController

  beforeEach(() => {
    cancellationController = new TurnCancellationController()
  })

  describe('when nothing has cancelled it', () => {
    it('reports itself uncancelled', () => {
      expect(cancellationController.isCancelled()).toBe(false)
    })

    it('leaves its signal unaborted', () => {
      expect(cancellationController.signal().aborted).toBe(false)
    })

    it('leaves whenCancelled pending', async () => {
      const settled = await Promise.race([
        cancellationController.whenCancelled().then(() => 'cancelled'),
        Promise.resolve('pending'),
      ])

      expect(settled).toBe('pending')
    })
  })

  describe('when it has been cancelled', () => {
    beforeEach(() => {
      cancellationController.cancel()
    })

    it('reports itself cancelled', () => {
      expect(cancellationController.isCancelled()).toBe(true)
    })

    it('aborts its signal, so a request in flight stops', () => {
      expect(cancellationController.signal().aborted).toBe(true)
    })

    it('resolves whenCancelled', async () => {
      await expect(cancellationController.whenCancelled()).resolves.toBeUndefined()
    })
  })

  describe('when it is cancelled twice', () => {
    it('stays cancelled, so a double click is harmless', () => {
      cancellationController.cancel()
      cancellationController.cancel()

      expect(cancellationController.isCancelled()).toBe(true)
    })
  })

  describe('when a cancel lands while whenCancelled is awaited', () => {
    it('resolves the wait that was already pending', async () => {
      const wait = cancellationController.whenCancelled()

      cancellationController.cancel()

      await expect(wait).resolves.toBeUndefined()
    })
  })
})
