import { Phase } from '../models/panel-state'

// Naming the wait is what makes a stall diagnosable: a transcription that hangs
// and a model that hangs look identical otherwise (FR10).
const PENDING_LINES: Partial<Record<Phase, string>> = {
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  cancelling: 'Stopping…',
}

export const PendingEntry = ({ phase }: { phase: Phase }) => {
  const line = PENDING_LINES[phase]
  if (!line) return null
  return (
    <div className="owl-pending" aria-label="Turn in progress">
      {line}
    </div>
  )
}
