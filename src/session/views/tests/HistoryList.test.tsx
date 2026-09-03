import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HistoryList } from '../HistoryList'
import { Entry } from '../../models/panel-state'

describe('HistoryList', () => {
  const entries: Entry[] = [{ kind: 'user', text: 'do the thing' }]

  describe('when a turn is running', () => {
    it('renders the pending line after the entries', () => {
      const { container } = render(<HistoryList entries={entries} phase="thinking" />)

      const rendered = container.querySelectorAll('.owl-entry, .owl-pending')

      expect(rendered[rendered.length - 1].className).toBe('owl-pending')
    })

    it('renders the pending line when the history is empty', () => {
      render(<HistoryList entries={[]} phase="transcribing" />)

      expect(screen.getByLabelText('Turn in progress')).toBeDefined()
    })
  })

  describe('when no turn is running', () => {
    it('renders no pending line when the phase is idle', () => {
      render(<HistoryList entries={entries} phase="idle" />)

      expect(screen.queryByLabelText('Turn in progress')).toBeNull()
    })
  })
})
