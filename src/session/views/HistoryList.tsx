import { HistoryEntry } from './HistoryEntry'
import { PendingEntry } from './PendingEntry'
import { RecordingStrip } from './RecordingStrip'
import { PanelEntry, Phase } from '../models/panel-state'

export interface HistoryListProps {
  entries: PanelEntry[]
  phase: Phase
  // The two live facts of a running recording, at rest in every other phase.
  level?: number
  elapsedSeconds?: number
  onChooseNote?(chosen: string | null): void
  onPickSuggestion?(suggestion: string): void
  onRetry?(): void
}

export const HistoryList = ({
  entries,
  phase,
  level = 0,
  elapsedSeconds = 0,
  onChooseNote,
  onPickSuggestion,
  onRetry,
}: HistoryListProps) => (
  <div className="tyto-history">
    {entries.map((entry, index) => (
      <HistoryEntry
        key={index}
        entry={entry}
        onChooseNote={onChooseNote}
        onPickSuggestion={onPickSuggestion}
        onRetry={onRetry}
      />
    ))}
    <PendingEntry phase={phase} />
    <RecordingStrip phase={phase} level={level} elapsedSeconds={elapsedSeconds} />
  </div>
)
