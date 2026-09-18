import { HistoryEntry } from './HistoryEntry'
import { HistoryTurn } from './HistoryTurn'
import { PendingEntry } from './PendingEntry'
import { PanelItem, Phase } from '../models/panel-state'
import { MarkdownRenderFn } from './markdown-render'

export interface HistoryListProps {
  entries: PanelItem[]
  phase: Phase
  onChooseNote?: (chosen: string | null) => void
  onPickSuggestion?: (suggestion: string) => void
  onRetry?: () => void
  renderMarkdownFn?: MarkdownRenderFn
}

export const HistoryList = ({
  entries,
  phase,
  onChooseNote,
  onPickSuggestion,
  onRetry,
  renderMarkdownFn,
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
          renderMarkdownFn={renderMarkdownFn}
        />
      ) : (
        <HistoryEntry
          key={index}
          entry={item}
          onChooseNote={onChooseNote}
          onPickSuggestion={onPickSuggestion}
          onRetry={onRetry}
          renderMarkdownFn={renderMarkdownFn}
        />
      ),
    )}
    <PendingEntry phase={phase} />
  </div>
)
