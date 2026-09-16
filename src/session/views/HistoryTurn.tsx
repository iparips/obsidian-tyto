import { HistoryEntry } from './HistoryEntry'
import { PanelTurn } from '../models/panel-state'
import { NoteName } from '../models/note-name'

export interface HistoryTurnProps {
  turn: PanelTurn
  onChooseNote?(chosen: string | null): void
  onPickSuggestion?(suggestion: string): void
  onRetry?(): void
}

// The target first, since it is the most prominent thing a turn says about
// itself (D4): the note this turn is writing to, which a tool call can move.
export const HistoryTurn = ({
  turn,
  onChooseNote,
  onPickSuggestion,
  onRetry,
}: HistoryTurnProps) => (
  <div className="tyto-turn">
    <div className="tyto-turn-target">
      {turn.target === null ? 'No note' : NoteName.of(turn.target)}
    </div>
    {turn.entries.map((entry, index) => (
      <HistoryEntry
        key={index}
        entry={entry}
        onChooseNote={onChooseNote}
        onPickSuggestion={onPickSuggestion}
        onRetry={onRetry}
      />
    ))}
  </div>
)
