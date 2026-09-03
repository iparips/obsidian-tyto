import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { NOTICES } from '../../test-support/__mocks__/obsidian'
import { TurnNotices } from '../turn-notices'

describe('TurnNotices', () => {
  let revealPanel: Mock<[], void>
  let panelVisible: boolean

  beforeEach(() => {
    vi.clearAllMocks()
    NOTICES.length = 0
    revealPanel = vi.fn()
    panelVisible = false
  })

  const notices = () => new TurnNotices(() => panelVisible, revealPanel)

  const lastNotice = () => NOTICES[NOTICES.length - 1]

  describe('when the panel is closed', () => {
    it('shows a waiting notice that does not fade when a turn starts waiting', () => {
      notices().waiting('Which shopping list?')

      expect(lastNotice().duration).toBe(0)
    })

    it('names what is being asked and how to answer it when a turn starts waiting', () => {
      notices().waiting('Which shopping list?')

      expect(lastNotice().message).toBe('Which shopping list? Tap to answer.')
    })

    it('shows a finished notice that fades when a turn finishes', () => {
      notices().finished('Added toilet paper.')

      expect(lastNotice().duration).toBeGreaterThan(0)
    })

    it('says what the turn did and how to see it when a turn finishes', () => {
      notices().finished('Added toilet paper.')

      expect(lastNotice().message).toBe('Added toilet paper. Tap to view.')
    })

    it('shows a failed notice that fades when a turn fails', () => {
      notices().failed('the key was rejected')

      expect(lastNotice().duration).toBeGreaterThan(0)
    })

    it('reads as a failure rather than as a turn that finished when a turn fails', () => {
      notices().failed('the key was rejected')

      expect(lastNotice().message).toBe('Owl failed: the key was rejected Tap to view.')
    })
  })

  describe('when the panel is already visible', () => {
    beforeEach(() => {
      panelVisible = true
    })

    it('shows nothing when a turn starts waiting', () => {
      notices().waiting('Which shopping list?')

      expect(NOTICES).toEqual([])
    })

    it('shows nothing when a turn finishes', () => {
      notices().finished('Added toilet paper.')

      expect(NOTICES).toEqual([])
    })

    it('shows nothing when a turn fails', () => {
      notices().failed('the key was rejected')

      expect(NOTICES).toEqual([])
    })
  })

  describe('when the waiting notice is acted on', () => {
    let turnNotices: TurnNotices

    beforeEach(() => {
      turnNotices = notices()
      turnNotices.waiting('Which shopping list?')
    })

    it('reveals the session leaf when a notice is clicked', () => {
      lastNotice().messageEl.dispatchEvent(new Event('click'))

      expect(revealPanel).toHaveBeenCalled()
    })

    it('hides the notice when it is clicked', () => {
      lastNotice().messageEl.dispatchEvent(new Event('click'))

      expect(lastNotice().hidden).toBe(true)
    })

    it('opens no panel on its own when a turn starts waiting', () => {
      expect(revealPanel).not.toHaveBeenCalled()
    })

    it('dismisses the waiting notice when the answer arrives', () => {
      turnNotices.dismiss()

      expect(lastNotice().hidden).toBe(true)
    })
  })

  describe('when nothing is waiting', () => {
    it('dismisses nothing when no notice is up', () => {
      expect(() => notices().dismiss()).not.toThrow()
    })
  })
})
