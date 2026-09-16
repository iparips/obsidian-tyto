import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllowedEntries } from '../AllowedEntries'

describe('AllowedEntries', () => {
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
  })

  const renderEntries = (entries: string[]) =>
    render(<AllowedEntries entries={entries} onChange={onChange} />)

  const field = () => screen.getByLabelText('Allowed commands') as HTMLTextAreaElement

  describe('when the entries are rendered', () => {
    it('shows one entry per line when several are stored', () => {
      renderEntries(['daily-notes', 'shopping:add'])

      expect(field().value).toBe('daily-notes\nshopping:add')
    })

    it('follows the stored entries when the picker adds one', () => {
      const { rerender } = renderEntries(['daily-notes'])

      rerender(<AllowedEntries entries={['daily-notes', 'shopping:add']} onChange={onChange} />)

      expect(field().value).toBe('daily-notes\nshopping:add')
    })
  })

  describe('when the user edits the entries', () => {
    it('publishes one entry per line when several lines are entered', async () => {
      renderEntries([])

      await userEvent.click(field())
      await userEvent.paste('daily-notes\nshopping:add')

      expect(onChange).toHaveBeenLastCalledWith(['daily-notes', 'shopping:add'])
    })

    it('keeps a newline typed after an entry, so a second can be started', async () => {
      renderEntries(['daily-notes'])

      await userEvent.click(field())
      await userEvent.keyboard('{End}{Enter}')

      expect(field().value).toBe('daily-notes\n')
    })

    it('drops blank lines when the entries are published', async () => {
      renderEntries([])

      await userEvent.click(field())
      await userEvent.paste('daily-notes\n  \n')

      expect(onChange).toHaveBeenLastCalledWith(['daily-notes'])
    })

    it('publishes an empty list when the last entry is deleted', async () => {
      renderEntries(['daily-notes'])

      await userEvent.clear(field())

      expect(onChange).toHaveBeenLastCalledWith([])
    })
  })

  describe('when an entry is validated', () => {
    it('shows no error while an entry is still being typed', async () => {
      renderEntries([])

      await userEvent.click(field())
      await userEvent.paste('daily*')

      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('shows the reason when an invalid entry is left', async () => {
      renderEntries([])

      await userEvent.click(field())
      await userEvent.paste('daily*')
      await userEvent.tab()

      expect(screen.getByRole('alert').textContent).toBe(
        'a pattern must name a plugin, as plugin-id:*',
      )
    })

    it('shows no error when every entry is valid on leaving', async () => {
      renderEntries([])

      await userEvent.click(field())
      await userEvent.paste('daily-notes\nopen-or-create-file-command:*')
      await userEvent.tab()

      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('keeps what the user typed when an entry is refused', async () => {
      renderEntries([])

      await userEvent.click(field())
      await userEvent.paste('daily*')
      await userEvent.tab()

      expect(field().value).toBe('daily*')
    })
  })
})
