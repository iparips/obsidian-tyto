import { ProgressLine } from '../models/panel-state'
import { NoteName } from '../models/note-name'

// Collapsed by default, like the resolved commands in settings: the reply is
// what the user reads, and how the turn got there is a check they open when a
// turn surprises them.
export const EntryProgress = ({
  lines,
  target,
}: {
  lines: ProgressLine[]
  target: string | null
}) => (
  <details className="tyto-entry-progress">
    <summary>{summaryOf(lines)}</summary>
    <ol aria-label="What the turn did">
      {lines.map((line, index) => (
        <ProgressRow key={index} line={line} target={target} />
      ))}
    </ol>
  </details>
)

// The note only where it differs from the turn's target: the turn names its
// target at the top, so repeating it down the list buries the line worth
// reading (D2).
const ProgressRow = ({ line, target }: { line: ProgressLine; target: string | null }) => (
  <li className={line.refused ? 'tyto-progress-refused' : undefined}>
    <span className="tyto-progress-label">{line.label}</span>
    <span className="tyto-progress-detail">{line.detail}</span>
    {line.note !== null && line.note !== target && (
      <span className="tyto-progress-note">{NoteName.of(line.note)}</span>
    )}
  </li>
)

// The refusal count is in the summary because it is the reason to open the
// list: a turn that refused nothing rarely needs explaining.
const summaryOf = (lines: ProgressLine[]): string => {
  const refused = lines.filter((line) => line.refused).length
  const count = `${lines.length} ${lines.length === 1 ? 'step' : 'steps'}`
  return refused === 0 ? count : `${count}, ${refused} refused`
}
