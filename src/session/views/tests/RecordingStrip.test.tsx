import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecordingStrip } from '../RecordingStrip'

describe('RecordingStrip', () => {
  const renderStrip = (level = 0, elapsedSeconds = 0) =>
    render(<RecordingStrip phase="recording" level={level} elapsedSeconds={elapsedSeconds} />)

  const barHeights = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('.tyto-recording-bar')).map((bar) =>
      parseFloat(bar.style.height),
    )

  describe('when a recording is running', () => {
    it('renders a meter beside the clock', () => {
      const { container } = renderStrip()

      expect(screen.getByLabelText('Recording')).toBeDefined()
      expect(container.querySelectorAll('.tyto-recording-bar')).toHaveLength(5)
    })

    it('holds every bar at a visible floor while the level is at rest', () => {
      const { container } = renderStrip(0)

      expect(barHeights(container)).toEqual([15, 15, 15, 15, 15])
    })

    it('raises every bar above the floor as the level rises', () => {
      const { container } = renderStrip(1)

      expect(barHeights(container).every((height) => height > 15)).toBe(true)
    })

    it('caps the bars at full height when the level runs over one', () => {
      const { container } = renderStrip(2)

      expect(Math.max(...barHeights(container))).toBe(100)
    })
  })

  describe('when the clock is read', () => {
    it('shows seconds under a minute as m:ss', () => {
      renderStrip(0, 7)

      expect(screen.getByText('0:07')).toBeDefined()
    })

    it('shows minutes and seconds past a minute as m:ss', () => {
      renderStrip(0, 305)

      expect(screen.getByText('5:05')).toBeDefined()
    })
  })

  describe('when no recording is running', () => {
    it('renders nothing when the phase is idle', () => {
      render(<RecordingStrip phase="idle" level={0} elapsedSeconds={0} />)

      expect(screen.queryByLabelText('Recording')).toBeNull()
    })

    it('renders nothing when the phase is transcribing', () => {
      render(<RecordingStrip phase="transcribing" level={0} elapsedSeconds={0} />)

      expect(screen.queryByLabelText('Recording')).toBeNull()
    })
  })
})
