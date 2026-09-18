import { Fragment } from 'react'
import { HistoryEntry } from './HistoryEntry'
import { EntryProgress } from './EntryProgress'
import { PanelTurn, ProgressLine, TurnSpendReport } from '../models/panel-state'
import { NoteName } from '../models/note-name'
import { MarkdownRenderFn } from './markdown-render'

export interface HistoryTurnProps {
  turn: PanelTurn
  onChooseNote?: (chosen: string | null) => void
  onPickSuggestion?: (suggestion: string) => void
  onRetry?: () => void
  renderMarkdownFn?: MarkdownRenderFn
}

// The target under the utterance rather than above it, since a turn resolves
// its target from what the user said: showing it first claims the note was
// settled before they spoke. The utterance opens the turn, so it is the first
// entry and the target follows it (D4).
export const HistoryTurn = ({
  turn,
  onChooseNote,
  onPickSuggestion,
  onRetry,
  renderMarkdownFn,
}: HistoryTurnProps) => (
  <div className="tyto-turn">
    {turn.entries.map((entry, index) => (
      <Fragment key={index}>
        {entry.kind === 'progress' ? (
          <ProgressEntry lines={entry.lines} target={turn.target} spend={entry.spend} />
        ) : (
          <HistoryEntry
            entry={entry}
            onChooseNote={onChooseNote}
            onPickSuggestion={onPickSuggestion}
            onRetry={onRetry}
            renderMarkdownFn={renderMarkdownFn}
          />
        )}
        {entry.kind === 'user' && <TurnTarget target={turn.target} />}
      </Fragment>
    ))}
  </div>
)

// The name reads as the turn's heading and the path sits under it: the name is
// what a reader scans for, and the path is what says which of the weekly notes
// sharing that name this turn actually edited.
const TurnTarget = ({ target }: { target: string | null }) => {
  if (target === null) return <div className="tyto-turn-target">Edit target: no note</div>
  return (
    <div className="tyto-turn-target">
      <div className="tyto-turn-target-name">Edit target: {NoteName.of(target)}</div>
      <div className="tyto-turn-target-path">{target}</div>
    </div>
  )
}

// Rendered here rather than through HistoryEntry, because only the turn holds
// the target a line's note is compared against. Threading it through
// HistoryEntry would hand all nine other kinds a fact one of them needs.
const ProgressEntry = ({
  lines,
  target,
  spend,
}: {
  lines: ProgressLine[]
  target: string | null
  spend?: TurnSpendReport
}) => (
  <div className="tyto-entry tyto-entry-context tyto-entry-progress-line">
    <div className="tyto-entry-body">
      <EntryProgress lines={lines} target={target} spend={spend} />
    </div>
  </div>
)
