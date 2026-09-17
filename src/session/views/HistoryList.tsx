import { HistoryEntry } from './HistoryEntry'
import { HistoryTurn } from './HistoryTurn'
import { PendingEntry } from './PendingEntry'
import { PanelItem, Phase } from '../models/panel-state'

export interface HistoryListProps {
  entries: PanelItem[]
  phase: Phase
  onChooseNote?: (chosen: string | null) => void
  onPickSuggestion?: (suggestion: string) => void
  onRetry?: () => void
}

export const HistoryList = ({
  entries,
  phase,
  onChooseNote,
  onPickSuggestion,
  onRetry,
}: HistoryListProps) => (
  <div className="tyto-history">
    {entries.map((item, index) =>
      item.kind === 'turn' ? (
        <HistoryTurn
          key={index}
          turn={item}
          onChooseNote={onChooseNote}
          onPickSuggestion={onPickSuggestion}
          onRetry={onRetry}
        />
      ) : (
        <HistoryEntry
          key={index}
          entry={item}
          onChooseNote={onChooseNote}
          onPickSuggestion={onPickSuggestion}
          onRetry={onRetry}
        />
      ),
    )}
    <PendingEntry phase={phase} />
  </div>
)
