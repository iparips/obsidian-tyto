import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PanelHeader, PanelHeaderProps } from '../PanelHeader'

// The transcript carries note text and vault instructions verbatim, so the
// button is absent rather than greyed until the setting turns it on: a greyed
// control with nothing naming the setting reads as broken.
describe('PanelHeader', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  const renderHeader = (overrides: Partial<PanelHeaderProps> = {}) =>
    render(<PanelHeader name="note" path="a/note.md" running={false} {...overrides} />)

  const copyButton = () => screen.queryByRole('button', { name: 'Copy transcript' })

  describe('when the setting is off', () => {
    it('holds Reset and no Copy button', () => {
      renderHeader({ onReset: vi.fn() })

      expect(screen.getByRole('button', { name: 'Reset session' })).toBeTruthy()
      expect(copyButton()).toBeNull()
    })
  })

  describe('when the setting is on', () => {
    it('adds the button once there is something to copy', () => {
      renderHeader({ onCopy: () => 'a transcript', hasEntries: true })

      expect(copyButton()?.hasAttribute('disabled')).toBe(false)
    })

    it('disables the button while a turn runs', () => {
      renderHeader({ onCopy: () => 'a transcript', hasEntries: true, running: true })

      expect(copyButton()?.hasAttribute('disabled')).toBe(true)
    })

    it('disables the button while there are no entries', () => {
      renderHeader({ onCopy: () => 'a transcript', hasEntries: false })

      expect(copyButton()?.hasAttribute('disabled')).toBe(true)
    })

    it('writes the transcript to the clipboard and says it copied', async () => {
      renderHeader({ onCopy: () => 'a transcript', hasEntries: true })

      await userEvent.click(copyButton() as HTMLElement)

      expect(writeText).toHaveBeenCalledWith('a transcript')
      expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy()
    })
  })
})
