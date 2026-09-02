import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistoryEntry } from '../HistoryEntry'

describe('HistoryEntry', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  describe('when the entry is copied', () => {
    it('writes the entry text to the clipboard when copy is clicked', async () => {
      render(<HistoryEntry entry={{ kind: 'assistant', text: 'made the edit' }} />)

      await userEvent.click(screen.getByLabelText('Copy entry'))

      expect(writeText).toHaveBeenCalledWith('made the edit')
    })

    it('writes the step and message when the entry is an error', async () => {
      render(<HistoryEntry entry={{ kind: 'error', step: 'chat', text: 'it broke' }} />)

      await userEvent.click(screen.getByLabelText('Copy entry'))

      expect(writeText).toHaveBeenCalledWith('chat failed: it broke')
    })

    it('confirms the copy when the write succeeds', async () => {
      render(<HistoryEntry entry={{ kind: 'user', text: 'do the thing' }} />)

      await userEvent.click(screen.getByLabelText('Copy entry'))

      await waitFor(() => expect(screen.getByLabelText('Copied')).toBeDefined())
    })
  })
})
