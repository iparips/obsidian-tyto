import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandPicker } from '../CommandPicker'
import { CommandSearch } from '../../commands/command-search'
import { AllowList } from '../../commands/allow-list'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

describe('CommandPicker', () => {
  let registry: FakeCommandRegistry
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
    registry = new FakeCommandRegistry()
      .withCommand('daily-notes', 'Daily notes: Open todays daily note')
      .withCommand('daily-notes:goto-prev', 'Open previous daily note')
      .withCommand('open-or-create-file-command:3', 'Open or Create File: Shopping list')
  })

  const renderPicker = (entries: string[] = []) =>
    render(
      <CommandPicker
        entries={entries}
        search={new CommandSearch(registry.asRegistry(), new AllowList(entries))}
        onChange={onChange}
      />,
    )

  const type = async (query: string) => {
    await userEvent.click(screen.getByLabelText('Find a command'))
    await userEvent.paste(query)
  }

  describe('when a query is typed', () => {
    it('renders the matching commands when a query matches', async () => {
      renderPicker()

      await type('previous')

      expect(screen.getByText('Open previous daily note')).toBeDefined()
    })

    it('renders nothing before a query is typed', () => {
      renderPicker()

      expect(screen.getByLabelText('Matching commands').textContent).toBe('')
    })

    it('renders nothing when the query is cleared', async () => {
      renderPicker()
      await type('previous')

      await userEvent.clear(screen.getByLabelText('Find a command'))

      expect(screen.getByLabelText('Matching commands').textContent).toBe('')
    })
  })

  describe('when a command is chosen', () => {
    it('publishes the exact id and no name when a row is clicked', async () => {
      renderPicker()
      await type('previous')

      await userEvent.click(screen.getByRole('button', { name: /Open previous daily note/ }))

      expect(onChange).toHaveBeenCalledWith(['daily-notes:goto-prev'])
    })

    it('appends to the entries already stored when a row is clicked', async () => {
      renderPicker(['shopping:add'])
      await type('previous')

      await userEvent.click(screen.getByRole('button', { name: /Open previous daily note/ }))

      expect(onChange).toHaveBeenCalledWith(['shopping:add', 'daily-notes:goto-prev'])
    })

    it('clears the query when a row is clicked, so the results close', async () => {
      renderPicker()
      await type('previous')

      await userEvent.click(screen.getByRole('button', { name: /Open previous daily note/ }))

      expect((screen.getByLabelText('Find a command') as HTMLInputElement).value).toBe('')
    })

    it('closes the results when a row is clicked', async () => {
      renderPicker()
      await type('previous')

      await userEvent.click(screen.getByRole('button', { name: /Open previous daily note/ }))

      expect(screen.getByLabelText('Matching commands').textContent).toBe('')
    })
  })

  describe('when a command is already covered', () => {
    it('names the entry that covers it when a pattern covers the command', async () => {
      renderPicker(['daily-notes:*'])

      await type('previous')

      expect(screen.getByText('Allowed by daily-notes:*')).toBeDefined()
    })

    it('offers no way to add it again when the command is already covered', async () => {
      renderPicker(['daily-notes:*'])

      await type('previous')

      const row = screen.getByRole('button', { name: /Open previous daily note/ })

      expect((row as HTMLButtonElement).disabled).toBe(true)
    })
  })

  describe('when the search overflows the cap', () => {
    it('says more matched when the search reports an overflow', async () => {
      Array.from({ length: 21 }, (_, index) =>
        registry.withCommand(`bulk:goto-${index}`, `Bulk note ${index}`),
      )
      renderPicker()

      await type('Bulk note')

      expect(screen.getByText(/More commands matched/)).toBeDefined()
    })

    it('shows no overflow line when the matches fit under the cap', async () => {
      renderPicker()

      await type('previous')

      expect(screen.queryByText(/More commands matched/)).toBeNull()
    })
  })
})
