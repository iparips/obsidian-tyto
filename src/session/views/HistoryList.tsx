import { HistoryEntry } from './HistoryEntry'
import { PendingEntry } from './PendingEntry'
import { PanelEntry, Phase } from '../models/panel-state'

export interface HistoryListProps {
  entries: PanelEntry[]
  phase: Phase
  onChooseNote?(chosen: string | null): void
  onPickSuggestion?(suggestion: string): void
  onRetry?(): void
}

export const HistoryList = ({
  entries,
  phase,
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
  </div>
)
