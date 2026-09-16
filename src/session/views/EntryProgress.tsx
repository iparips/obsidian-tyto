import { ProgressLine } from '../models/panel-state'

// Collapsed by default, like the resolved commands in settings: the reply is
// what the user reads, and how the turn got there is a check they open when a
// turn surprises them.
export const EntryProgress = ({ lines }: { lines: ProgressLine[] }) => (
  <details className="tyto-entry-progress">
    <summary>{summaryOf(lines)}</summary>
    <ol aria-label="What the turn did">
      {lines.map((line, index) => (
        <li key={index} className={line.refused ? 'tyto-progress-refused' : undefined}>
          <span className="tyto-progress-label">{line.label}</span>
          <span className="tyto-progress-detail">{line.detail}</span>
        </li>
      ))}
    </ol>
  </details>
)

// The refusal count is in the summary because it is the reason to open the
// list: a turn that refused nothing rarely needs explaining.
const summaryOf = (lines: ProgressLine[]): string => {
  const refused = lines.filter((line) => line.refused).length
  const count = `${lines.length} ${lines.length === 1 ? 'step' : 'steps'}`
  return refused === 0 ? count : `${count}, ${refused} refused`
}
