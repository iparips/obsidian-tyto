import { beforeEach, describe, expect, it } from 'vitest'
import { TurnCancellation } from '../turn-cancellation'

describe('TurnCancellation', () => {
  let cancellation: TurnCancellation

  beforeEach(() => {
    cancellation = new TurnCancellation()
  })

  describe('when nothing has cancelled it', () => {
    it('reports itself uncancelled', () => {
      expect(cancellation.isCancelled()).toBe(false)
    })

    it('leaves its signal unaborted', () => {
      expect(cancellation.signal().aborted).toBe(false)
    })

    it('leaves whenCancelled pending', async () => {
      const settled = await Promise.race([
        cancellation.whenCancelled().then(() => 'cancelled'),
        Promise.resolve('pending'),
      ])

      expect(settled).toBe('pending')
    })
  })

  describe('when it has been cancelled', () => {
    beforeEach(() => {
      cancellation.cancel()
    })

    it('reports itself cancelled', () => {
      expect(cancellation.isCancelled()).toBe(true)
    })

    it('aborts its signal, so a request in flight stops', () => {
      expect(cancellation.signal().aborted).toBe(true)
    })

    it('resolves whenCancelled', async () => {
      await expect(cancellation.whenCancelled()).resolves.toBeUndefined()
    })
  })

  describe('when it is cancelled twice', () => {
    it('stays cancelled, so a double click is harmless', () => {
      cancellation.cancel()
      cancellation.cancel()

      expect(cancellation.isCancelled()).toBe(true)
    })
  })

  describe('when a cancel lands while whenCancelled is awaited', () => {
    it('resolves the wait that was already pending', async () => {
      const wait = cancellation.whenCancelled()

      cancellation.cancel()

      await expect(wait).resolves.toBeUndefined()
    })
  })
})
