import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecordingStrip } from '../RecordingStrip'

describe('RecordingStrip', () => {
  const renderStrip = (levels: number[] = [0, 0, 0], elapsedSeconds = 0) =>
    render(<RecordingStrip phase="recording" levels={levels} elapsedSeconds={elapsedSeconds} />)

  const barHeights = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('.tyto-recording-bar')).map((bar) =>
      parseFloat(bar.style.height),
    )

  describe('when a recording is running', () => {
    it('renders one bar per reading it was handed', () => {
      const { container } = renderStrip([0, 0.5, 1, 0.5])

      expect(screen.getByLabelText('Recording')).toBeDefined()
      expect(container.querySelectorAll('.tyto-recording-bar')).toHaveLength(4)
    })

    it('holds every bar at a visible floor while the readings are at rest', () => {
      const { container } = renderStrip([0, 0, 0])

      expect(barHeights(container)).toEqual([15, 15, 15])
    })

    // The trail is what a level meter could not say: a dead mic reads as a flat
    // line where five bars at the floor could be silence.
    it('draws each reading at its own height, so the trail shows what was heard', () => {
      const { container } = renderStrip([0, 1, 0])

      expect(barHeights(container)).toEqual([15, 100, 15])
    })

    it('caps a bar at full height when its reading runs over one', () => {
      const { container } = renderStrip([2])

      expect(barHeights(container)).toEqual([100])
    })
  })

  describe('when the clock is read', () => {
    it('shows seconds under a minute as m:ss', () => {
      renderStrip([0], 7)

      expect(screen.getByText('0:07')).toBeDefined()
    })

    it('shows minutes and seconds past a minute as m:ss', () => {
      renderStrip([0], 305)

      expect(screen.getByText('5:05')).toBeDefined()
    })
  })

  describe('when no recording is running', () => {
    it('renders nothing when the phase is idle', () => {
      render(<RecordingStrip phase="idle" levels={[0]} elapsedSeconds={0} />)

      expect(screen.queryByLabelText('Recording')).toBeNull()
    })

    it('renders nothing when the phase is transcribing', () => {
      render(<RecordingStrip phase="transcribing" levels={[0]} elapsedSeconds={0} />)

      expect(screen.queryByLabelText('Recording')).toBeNull()
    })
  })
})
