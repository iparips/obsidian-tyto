import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from '../SettingsPanel'
import { DEFAULT_SETTINGS, OpenMode, OwlSettings } from '../settings'
import { CommandSearch } from '../../commands/command-search'
import { AllowList } from '../../commands/allow-list'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

// The stored values stay 'confirm' and 'auto' (FR16), so no vault needs
// migrating and a user who chose to be asked is still asked. Only the wording
// changes, which is what these hold in place.
describe('SettingsPanel', () => {
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
  })

  const renderPanel = (openMode: OpenMode) => {
    const settings: OwlSettings = { ...DEFAULT_SETTINGS, openMode }
    return render(
      <SettingsPanel
        settings={settings}
        onChange={onChange}
        search={new CommandSearch(new FakeCommandRegistry().asRegistry(), new AllowList([]))}
        resolvedCommands={[]}
      />,
    )
  }

  const checkbox = () => screen.getByLabelText('Choose the note Owl opens') as HTMLInputElement

  describe('when the stored mode is confirm', () => {
    it('reads the checkbox as on, so an upgraded vault keeps asking', () => {
      renderPanel('confirm')

      expect(checkbox().checked).toBe(true)
    })

    it('writes auto when the checkbox is turned off', async () => {
      renderPanel('confirm')

      await userEvent.click(checkbox())

      expect(onChange).toHaveBeenCalledWith({ openMode: 'auto' })
    })
  })

  describe('when the stored mode is auto', () => {
    it('reads the checkbox as off when the stored mode is auto', () => {
      renderPanel('auto')

      expect(checkbox().checked).toBe(false)
    })

    it('writes confirm when the checkbox is turned on, so the stored values are unchanged', async () => {
      renderPanel('auto')

      await userEvent.click(checkbox())

      expect(onChange).toHaveBeenCalledWith({ openMode: 'confirm' })
    })
  })

  describe('when the user reads the setting', () => {
    it('names the checkbox for choosing a note rather than approving one', () => {
      renderPanel('confirm')

      expect(screen.getByText('Ask which note Owl should open')).toBeTruthy()
    })

    it('says the panel shows the notes it found, rather than one note to approve', () => {
      renderPanel('confirm')

      expect(
        screen.getByText(/shows you the\s+notes it found and waits for you to pick one/),
      ).toBeTruthy()
    })
  })
})
