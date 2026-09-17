import { HistoryEntry } from './HistoryEntry'
import { EntryProgress } from './EntryProgress'
import { PanelTurn, ProgressLine } from '../models/panel-state'
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
    {turn.entries.map((entry, index) =>
      entry.kind === 'progress' ? (
        <ProgressEntry key={index} lines={entry.lines} target={turn.target} />
      ) : (
        <HistoryEntry
          key={index}
          entry={entry}
          onChooseNote={onChooseNote}
          onPickSuggestion={onPickSuggestion}
          onRetry={onRetry}
        />
      ),
    )}
  </div>
)

// Rendered here rather than through HistoryEntry, because only the turn holds
// the target a line's note is compared against. Threading it through
// HistoryEntry would hand all nine other kinds a fact one of them needs.
const ProgressEntry = ({ lines, target }: { lines: ProgressLine[]; target: string | null }) => (
  <div className="tyto-entry tyto-entry-context tyto-entry-progress-line">
    <div className="tyto-entry-body">
      <EntryProgress lines={lines} target={target} />
    </div>
  </div>
)
