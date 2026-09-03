import { HistoryEntry } from './HistoryEntry'
import { PendingEntry } from './PendingEntry'
import { Entry, Phase } from '../models/panel-state'

export interface HistoryListProps {
  entries: Entry[]
  phase: Phase
  onAnswerOpen?(granted: boolean): void
  onPickSuggestion?(suggestion: string): void
}

export const HistoryList = ({
  entries,
  phase,
  onAnswerOpen,
  onPickSuggestion,
}: HistoryListProps) => (
  <div className="owl-history">
    {entries.map((entry, index) => (
      <HistoryEntry
        key={index}
        entry={entry}
        onAnswerOpen={onAnswerOpen}
        onPickSuggestion={onPickSuggestion}
      />
    ))}
    <PendingEntry phase={phase} />
  </div>
)
