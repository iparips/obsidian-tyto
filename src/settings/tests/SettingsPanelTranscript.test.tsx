import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from '../SettingsPanel'
import { DEFAULT_SETTINGS, TytoSettings } from '../settings'
import { ObsidianCommandSearch } from '../../commands/obsidian-command-search'
import { AllowList } from '../../commands/allow-list'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

// Off by default because the transcript carries note text and vault
// instructions verbatim, which is the point of it and the reason to opt in.
describe('SettingsPanel transcript copy', () => {
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
  })

  const renderPanel = (overrides: Partial<TytoSettings> = {}) =>
    render(
      <SettingsPanel
        settings={{ ...DEFAULT_SETTINGS, ...overrides }}
        onChange={onChange}
        search={
          new ObsidianCommandSearch(new FakeCommandRegistry().asRegistry(), new AllowList([]))
        }
        resolvedCommands={[]}
      />,
    )

  const checkbox = () => screen.getByLabelText('Copy the session transcript') as HTMLInputElement

  it('reads the checkbox as off by default', () => {
    renderPanel()

    expect(checkbox().checked).toBe(false)
  })

  it('turns the setting on when the checkbox is clicked', async () => {
    renderPanel()

    await userEvent.click(checkbox())

    expect(onChange).toHaveBeenCalledWith({ transcriptCopyEnabled: true })
  })

  it('names what the transcript carries, so the choice is an informed one', () => {
    renderPanel()

    expect(screen.getByText(/note text and any vault instructions/)).toBeTruthy()
  })
})
