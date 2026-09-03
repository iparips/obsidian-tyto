import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllowListEditor } from '../AllowListEditor'
import { CommandSearch } from '../../commands/command-search'
import { AllowList } from '../../commands/allow-list'
import { AllowedCommand } from '../../commands/models/allowed-command'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

describe('AllowListEditor', () => {
  let registry: FakeCommandRegistry
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
    registry = new FakeCommandRegistry().withCommand('daily-notes', 'Open today')
  })

  const renderEditor = (entries: string[], resolved: AllowedCommand[] = []) =>
    render(
      <AllowListEditor
        entries={entries}
        search={new CommandSearch(registry.asRegistry(), new AllowList(entries))}
        resolved={resolved}
        onChange={onChange}
      />,
    )

  describe('when the surfaces are composed', () => {
    it('renders a row for an entry the picker added when it is stored', () => {
      renderEditor(['daily-notes'])

      expect(screen.getByLabelText('Entry daily-notes')).toBeDefined()
    })

    it('renders the picker above the list when settings open', () => {
      renderEditor([])

      expect(screen.getByLabelText('Find a command')).toBeDefined()
    })

    it('publishes the picked id when a searched command is chosen', async () => {
      renderEditor([])

      await userEvent.click(screen.getByLabelText('Find a command'))
      await userEvent.paste('today')
      await userEvent.click(screen.getByRole('button', { name: /Open today/ }))

      expect(onChange).toHaveBeenCalledWith(['daily-notes'])
    })
  })

  describe('when the entries resolve to commands', () => {
    const resolved = [
      new AllowedCommand('daily-notes', 'Open today'),
      new AllowedCommand('daily-notes:goto-prev', 'Open previous'),
    ]

    it('counts what the entries reach when they resolve', () => {
      renderEditor(['daily-notes:*'], resolved)

      expect(screen.getByText('Reaches 2 commands')).toBeDefined()
    })

    it('names each resolved command when the section is expanded', () => {
      renderEditor(['daily-notes:*'], resolved)

      expect(screen.getByLabelText('Resolved commands').textContent).toContain('Open today')
    })

    it('shows the id beside each resolved name when the section is expanded', () => {
      renderEditor(['daily-notes:*'], resolved)

      expect(screen.getByLabelText('Resolved commands').textContent).toContain(
        'daily-notes:goto-prev',
      )
    })

    it('collapses the section by default, so entries stay the setting', () => {
      const { container } = renderEditor(['daily-notes:*'], resolved)

      expect(container.querySelector('details')?.hasAttribute('open')).toBe(false)
    })

    it('says one command in the singular when a single entry resolves', () => {
      renderEditor(['daily-notes'], [new AllowedCommand('daily-notes', 'Open today')])

      expect(screen.getByText('Reaches 1 command')).toBeDefined()
    })
  })
})
