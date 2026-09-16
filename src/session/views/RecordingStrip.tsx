import { Phase } from '../models/panel-state'

export interface RecordingStripProps {
  phase: Phase
  // 0 to 1, held at rest under reduced motion.
  level: number
  elapsedSeconds: number
}

const BARS = 5
// Visible in silence, so a bar at rest still reads as a bar rather than a gap,
// and low enough that speech is plainly taller (FR: a dead mic looks dead).
const FLOOR = 0.15

// The one running phase the panel said nothing about. Takes PendingEntry's slot
// in the history, which returns nothing while recording.
export const RecordingStrip = ({ phase, level, elapsedSeconds }: RecordingStripProps) => {
  if (phase !== 'recording') return null
  return (
    <div className="tyto-recording-strip" aria-label="Recording">
      <div className="tyto-recording-meter">
        {heightsFor(level).map((height, index) => (
          <span key={index} className="tyto-recording-bar" style={{ height: `${height * 100}%` }} />
        ))}
      </div>
      <span className="tyto-recording-clock">{asClock(elapsedSeconds)}</span>
    </div>
  )
}

// Tallest in the middle, so the row reads as one signal rather than five
// independent readings of it.
const heightsFor = (level: number): number[] =>
  Array.from({ length: BARS }, (_, index) => {
    const distanceFromCentre = Math.abs(index - (BARS - 1) / 2) / ((BARS - 1) / 2)
    return FLOOR + (1 - FLOOR) * clamped(level) * (1 - 0.5 * distanceFromCentre)
  })

const clamped = (level: number): number => Math.min(Math.max(level, 0), 1)

// Counting up, with no limit worth counting toward (D3).
const asClock = (elapsedSeconds: number): string => {
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
