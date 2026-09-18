import { ProgressLine, TurnSpendReport } from '../models/panel-state'

// Collapsed by default, like the resolved commands in settings: the reply is
// what the user reads, and how the turn got there is a check they open when a
// turn surprises them.
export const EntryProgress = ({
  lines,
  target,
  spend,
}: {
  lines: ProgressLine[]
  target: string | null
  spend?: TurnSpendReport
}) => (
  <details className="tyto-entry-progress">
    <summary>{summaryOf(lines, spend)}</summary>
    <ol aria-label="What the turn did">
      {lines.map((line, index) => (
        <ProgressRow key={index} line={line} target={target} />
      ))}
    </ol>
  </details>
)

// A direct write says so on the line that made it, where a warning below the
// list named neither the edit it belonged to nor the note it reached.
//
// The note shows only where it differs from the turn's target, since the turn
// names its target at the top (D2). A direct write always names it: that edit
// is the one the user may need to undo by hand.
//
// No cause is named, because there are now two: a tab that moved, and a file
// whose editor does not match it. The consequence is the same and is what the
// reader can act on.
const ProgressRow = ({ line, target }: { line: ProgressLine; target: string | null }) => (
  <li className={line.refused ? 'tyto-progress-refused' : undefined}>
    <span className="tyto-progress-label">{line.label}</span>
    <span className="tyto-progress-detail">{line.detail}</span>
    {line.wroteDirect && (
      <>
        <span className="tyto-progress-detail tyto-progress-directly">directly.</span>
        <span className="tyto-progress-direct">Undo not available</span>
      </>
    )}
    {line.note !== null && (line.wroteDirect || line.note !== target) && (
      <div className="tyto-progress-note">{line.note}</div>
    )}
  </li>
)

// What the turn spent rather than how many rows it produced (D6). The row count
// invited a comparison with the budget it could only lose: a row is a progress
// line, and a batch of four calls publishes four of them for one charged step.
// The count is still the length of the list this summary opens.
//
// The refusal count stays, because it is the reason to open the list: a turn
// that refused nothing rarely needs explaining.
const summaryOf = (lines: ProgressLine[], spend?: TurnSpendReport): string => {
  const refused = lines.filter((line) => line.refused).length
  const headline = spend ? `${spend.used} of ${spend.budget} steps used` : lineCountOf(lines)
  return refused === 0 ? headline : `${headline}, ${refused} refused`
}

// The fallback for a turn with no spend to name: one restored from a record
// written before the spend was published, and a turn whose first charge has not
// landed. Named as lines rather than steps, since that is what they are.
const lineCountOf = (lines: ProgressLine[]): string =>
  `${lines.length} ${lines.length === 1 ? 'line' : 'lines'}`
