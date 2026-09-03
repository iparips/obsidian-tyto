import { HistoryEntry } from './HistoryEntry'
import { PendingEntry } from './PendingEntry'
import { Entry, Phase } from '../models/panel-state'

export interface HistoryListProps {
  entries: Entry[]
  phase: Phase
  onChooseNote?(chosen: string | null): void
  onPickSuggestion?(suggestion: string): void
}

export const HistoryList = ({
  entries,
  phase,
  onChooseNote,
  onPickSuggestion,
}: HistoryListProps) => (
  <div className="owl-history">
    {entries.map((entry, index) => (
      <HistoryEntry
        key={index}
        entry={entry}
        onChooseNote={onChooseNote}
        onPickSuggestion={onPickSuggestion}
      />
    ))}
    <PendingEntry phase={phase} />
  </div>
)
