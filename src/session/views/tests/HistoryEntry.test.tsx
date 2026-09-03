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

  describe('when the entry carries a weight', () => {
    it('carries the utterance weight class when the entry is a user entry', () => {
      const { container } = render(<HistoryEntry entry={{ kind: 'user', text: 'do the thing' }} />)

      expect(container.querySelector('.owl-entry-utterance')).not.toBeNull()
    })

    it('carries the reply weight class when the entry is an assistant entry', () => {
      const { container } = render(
        <HistoryEntry entry={{ kind: 'assistant', text: 'made the edit' }} />,
      )

      expect(container.querySelector('.owl-entry-reply')).not.toBeNull()
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

    it('offers no copy control on an utterance', () => {
      render(<HistoryEntry entry={{ kind: 'user', text: 'do the thing' }} />)

      expect(screen.queryByLabelText('Copy entry')).toBeNull()
    })

    it('confirms the copy when the write succeeds', async () => {
      render(<HistoryEntry entry={{ kind: 'assistant', text: 'made the edit' }} />)

      await userEvent.click(screen.getByLabelText('Copy entry'))

      await waitFor(() => expect(screen.getByLabelText('Copied')).toBeDefined())
    })
  })

  describe('when the entry records a command', () => {
    it('renders with the command class when the entry is a command', () => {
      const { container } = render(
        <HistoryEntry entry={{ kind: 'command', text: 'ran Open today' }} />,
      )

      expect(container.querySelector('.owl-entry-command')).not.toBeNull()
    })

    it('carries the context weight class beside the command class', () => {
      const { container } = render(
        <HistoryEntry entry={{ kind: 'command', text: 'ran Open today' }} />,
      )

      expect(container.querySelector('.owl-entry-context')).not.toBeNull()
    })

    it('offers no copy control on a context line', () => {
      render(<HistoryEntry entry={{ kind: 'command', text: 'ran Open today' }} />)

      expect(screen.queryByLabelText('Copy entry')).toBeNull()
    })
  })

  describe('when the entry is an answer', () => {
    const anAnswer = () => ({
      kind: 'answer' as const,
      text: 'The quote was 12k.',
      sources: ['Quotes/roofing.md', 'Journal/day.md'],
    })

    it('renders the sources apart from the body when the entry is an answer', () => {
      render(<HistoryEntry entry={anAnswer()} />)

      expect(screen.getByLabelText('Answer sources').textContent).toBe(
        'From 2: Quotes/roofing.md, Journal/day.md',
      )
    })

    it('keeps the sources inside the body, apart from the copy control', () => {
      const { container } = render(<HistoryEntry entry={anAnswer()} />)

      const body = container.querySelector('.owl-entry-body')

      expect(body?.querySelector('.owl-entry-sources')).not.toBeNull()
    })

    it('copies the body alone when copy is clicked on an answer', async () => {
      render(<HistoryEntry entry={anAnswer()} />)

      await userEvent.click(screen.getByLabelText('Copy entry'))

      expect(writeText).toHaveBeenCalledWith('The quote was 12k.')
    })

    it('renders with its own class rather than the assistant class', () => {
      const { container } = render(<HistoryEntry entry={anAnswer()} />)

      expect(container.querySelector('.owl-entry-assistant')).toBeNull()
    })

    it('says no notes matched when the answer cites no sources', () => {
      render(<HistoryEntry entry={{ kind: 'answer', text: 'Nothing found.', sources: [] }} />)

      expect(screen.getByLabelText('Answer sources').textContent).toBe('No notes matched')
    })
  })
})
