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

  describe('when entries are listed', () => {
    it('renders one row per entry when several are stored', () => {
      renderEntries(['daily-notes', 'shopping:add'])

      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('shows the entry itself when a row renders', () => {
      renderEntries(['daily-notes'])

      expect((screen.getByLabelText('Entry daily-notes') as HTMLInputElement).value).toBe(
        'daily-notes',
      )
    })
  })

  describe('when an entry is removed', () => {
    it('publishes the remaining entries when one is removed', async () => {
      renderEntries(['daily-notes', 'shopping:add'])

      await userEvent.click(screen.getByRole('button', { name: 'Remove shopping:add' }))

      expect(onChange).toHaveBeenCalledWith(['daily-notes'])
    })

    it('publishes an empty list when the only entry is removed', async () => {
      renderEntries(['shopping:add'])

      await userEvent.click(screen.getByRole('button', { name: 'Remove shopping:add' }))

      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  describe('when an entry is edited', () => {
    it('publishes the edited entry when a wildcard is typed over an id', async () => {
      renderEntries(['daily-notes:goto-today'])

      await userEvent.clear(screen.getByLabelText('Entry daily-notes:goto-today'))
      await userEvent.paste('daily-notes:*')

      expect(onChange).toHaveBeenLastCalledWith(['daily-notes:*'])
    })

    it('leaves the other entries untouched when one is edited', async () => {
      renderEntries(['shopping:add', 'daily-notes:goto-today'])

      await userEvent.clear(screen.getByLabelText('Entry daily-notes:goto-today'))
      await userEvent.paste('daily-notes:*')

      expect(onChange).toHaveBeenLastCalledWith(['shopping:add', 'daily-notes:*'])
    })
  })

  describe('when an edited entry breaks the rule', () => {
    it('shows the reason when the edited pattern has no colon', async () => {
      renderEntries(['daily-notes:goto-today'])

      await userEvent.clear(screen.getByLabelText('Entry daily-notes:goto-today'))
      await userEvent.paste('daily*')

      expect(screen.getByRole('alert').textContent).toBe(
        'a pattern must name a plugin, as plugin-id:*',
      )
    })

    it('keeps what the user typed when the edited entry is refused', async () => {
      renderEntries(['daily-notes:goto-today'])
      const field = screen.getByLabelText('Entry daily-notes:goto-today') as HTMLInputElement

      await userEvent.clear(field)
      await userEvent.paste('daily*')

      expect(field.value).toBe('daily*')
    })

    it('shows no alert when every entry is valid', () => {
      renderEntries(['daily-notes:*'])

      expect(screen.queryByRole('alert')).toBeNull()
    })
  })
})
