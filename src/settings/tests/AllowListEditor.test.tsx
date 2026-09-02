import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllowListEditor } from '../AllowListEditor'
import { AllowedCommand } from '../../commands/models/allowed-command'

describe('AllowListEditor', () => {
  let onChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onChange = vi.fn()
  })

  const renderEditor = (entries: string[], resolved: AllowedCommand[] = []) =>
    render(<AllowListEditor entries={entries} resolved={resolved} onChange={onChange} />)

  describe('when the user edits the entries', () => {
    it('publishes one entry per line when several lines are entered', async () => {
      renderEditor([])
      const field = screen.getByLabelText('Allowed commands')

      await userEvent.click(field)
      await userEvent.paste('daily-notes:*\nshopping:add')

      expect(onChange).toHaveBeenLastCalledWith(['daily-notes:*', 'shopping:add'])
    })

    it('keeps a newline typed after an entry, so a second can be started', async () => {
      renderEditor(['daily-notes:*'])
      const field = screen.getByLabelText('Allowed commands') as HTMLTextAreaElement

      await userEvent.click(field)
      await userEvent.keyboard('{End}{Enter}')

      expect(field.value).toBe('daily-notes:*\n')
    })

    it('publishes both entries when a second is typed on a new line', async () => {
      renderEditor(['daily-notes:*'])
      const field = screen.getByLabelText('Allowed commands')

      await userEvent.click(field)
      await userEvent.keyboard('{End}{Enter}')
      await userEvent.paste('shopping:add')

      expect(onChange).toHaveBeenLastCalledWith(['daily-notes:*', 'shopping:add'])
    })

    it('drops blank lines when the entries are published', async () => {
      renderEditor([])
      const field = screen.getByLabelText('Allowed commands')

      await userEvent.click(field)
      await userEvent.paste('daily-notes:*\n  \n')

      expect(onChange).toHaveBeenLastCalledWith(['daily-notes:*'])
    })
  })

  describe('when an entry is invalid', () => {
    it('shows the reason when an entry has no colon', () => {
      renderEditor(['daily-notes'])

      expect(screen.getByRole('alert').textContent).toBe(
        'an entry must name a plugin, as plugin-id:command-id',
      )
    })

    it('shows no alert when every entry is valid', () => {
      renderEditor(['daily-notes:*'])

      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('when entries resolve to commands', () => {
    const resolved = [
      new AllowedCommand('daily-notes:goto-today', 'Open today'),
      new AllowedCommand('daily-notes:goto-prev', 'Open previous'),
    ]

    it('counts the resolved commands when a pattern is listed', () => {
      renderEditor(['daily-notes:*'], resolved)

      expect(screen.getByText('2 commands allowed right now')).toBeDefined()
    })

    it('names each resolved command when a pattern is listed', () => {
      renderEditor(['daily-notes:*'], resolved)

      expect(screen.getByLabelText('Resolved commands').textContent).toContain(
        'Open today (daily-notes:goto-today)',
      )
    })

    it('collapses the resolved list by default when a pattern is listed', () => {
      const { container } = renderEditor(['daily-notes:*'], resolved)

      expect(container.querySelector('details')?.hasAttribute('open')).toBe(false)
    })
  })
})
