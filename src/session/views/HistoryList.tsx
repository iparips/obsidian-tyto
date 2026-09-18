import { HistoryEntry } from './HistoryEntry'
import { HistoryTurn } from './HistoryTurn'
import { PendingEntry } from './PendingEntry'
import { PanelItem, Phase } from '../models/panel-state'
import { MarkdownRenderFn } from './markdown-render'
import { OpenSourceNoteFn } from './open-source-note'

export interface HistoryListProps {
  entries: PanelItem[]
  phase: Phase
  onChooseNote?: (chosen: string | null) => void
  onPickSuggestion?: (suggestion: string) => void
  onRetry?: () => void
  renderMarkdownFn?: MarkdownRenderFn
  onOpenSource?: OpenSourceNoteFn
}

export const HistoryList = ({
  entries,
  phase,
  onChooseNote,
  onPickSuggestion,
  onRetry,
  renderMarkdownFn,
  onOpenSource,
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
          onOpenSource={onOpenSource}
        />
      ) : (
        <HistoryEntry
          key={index}
          entry={item}
          onChooseNote={onChooseNote}
          onPickSuggestion={onPickSuggestion}
          onRetry={onRetry}
          renderMarkdownFn={renderMarkdownFn}
          onOpenSource={onOpenSource}
        />
      ),
    )}
    <PendingEntry phase={phase} />
  </div>
)
