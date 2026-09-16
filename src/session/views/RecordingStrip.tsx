import { Phase } from '../models/panel-state'

export interface RecordingStripProps {
  phase: Phase
  // Recent levels, oldest first, each 0 to 1 and at rest under reduced motion.
  levels: readonly number[]
  elapsedSeconds: number
}

// Visible in silence, so a bar at rest still reads as a bar rather than a gap,
// and low enough that speech is plainly taller (FR: a dead mic looks dead).
const FLOOR = 0.15

// The one running phase the panel said nothing about. Sits in the input row
// rather than the history, which scrolls the trail out of sight once a session
// has run a few turns.
export const RecordingStrip = ({ phase, levels, elapsedSeconds }: RecordingStripProps) => {
  if (phase !== 'recording') return null
  return (
    <div className="tyto-recording-strip" aria-label="Recording">
      <span className="tyto-recording-clock">{asClock(elapsedSeconds)}</span>
      <div className="tyto-recording-meter">
        {levels.map((level, index) => (
          <span
            key={index}
            className="tyto-recording-bar"
            style={{ height: `${heightOf(level) * 100}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// One bar per reading, so the row is a trail of what the mic heard rather than
// five views of the current level.
const heightOf = (level: number): number => FLOOR + (1 - FLOOR) * clamped(level)

const clamped = (level: number): number => Math.min(Math.max(level, 0), 1)

// Counting up, with no limit worth counting toward (D3).
const asClock = (elapsedSeconds: number): string => {
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
