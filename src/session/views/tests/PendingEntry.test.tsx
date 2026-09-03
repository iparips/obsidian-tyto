import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PendingEntry } from '../PendingEntry'

describe('PendingEntry', () => {
  describe('when a turn is waiting', () => {
    it('names the transcribing wait when the phase is transcribing', () => {
      render(<PendingEntry phase="transcribing" />)

      expect(screen.getByLabelText('Turn in progress').textContent).toBe('Transcribing…')
    })

    it('names the thinking wait when the phase is thinking', () => {
      render(<PendingEntry phase="thinking" />)

      expect(screen.getByLabelText('Turn in progress').textContent).toBe('Thinking…')
    })
  })

  describe('when nothing is waiting', () => {
    it('renders nothing when the phase is recording', () => {
      render(<PendingEntry phase="recording" />)

      expect(screen.queryByLabelText('Turn in progress')).toBeNull()
    })

    it('renders nothing when the phase is idle', () => {
      render(<PendingEntry phase="idle" />)

      expect(screen.queryByLabelText('Turn in progress')).toBeNull()
    })
  })
})
