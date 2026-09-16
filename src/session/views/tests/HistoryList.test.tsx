import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HistoryList } from '../HistoryList'
import { PanelEntry } from '../../models/panel-state'

describe('HistoryList', () => {
  const entries: PanelEntry[] = [{ kind: 'user', text: 'do the thing' }]

  describe('when a turn is running', () => {
    it('renders the pending line after the entries', () => {
      const { container } = render(<HistoryList entries={entries} phase="thinking" />)

      const rendered = container.querySelectorAll('.tyto-entry, .tyto-pending')

      expect(rendered[rendered.length - 1].className).toBe('tyto-pending')
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

  describe('when a recording is running', () => {
    it('renders the recording strip after the entries', () => {
      const { container } = render(
        <HistoryList entries={entries} phase="recording" level={0.4} elapsedSeconds={12} />,
      )

      const rendered = container.querySelectorAll('.tyto-entry, .tyto-recording-strip')

      expect(rendered[rendered.length - 1].className).toBe('tyto-recording-strip')
    })

    it('renders the elapsed clock it was handed', () => {
      render(<HistoryList entries={entries} phase="recording" level={0} elapsedSeconds={12} />)

      expect(screen.getByText('0:12')).toBeDefined()
    })
  })
})
