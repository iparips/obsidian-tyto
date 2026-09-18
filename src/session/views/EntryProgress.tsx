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
    {/* Unordered, because a row is a progress line rather than a turn step: a
        batched step draws several rows, so an ordinal would run past the budget
        the summary names and read as arithmetic that does not add up. */}
    {/* No aria-label: the summary above names the list, and a label here
        surfaced as a tooltip on hover. */}
    <ul className="tyto-entry-progress-lines">
      {lines.map((line, index) => (
        <ProgressRow key={index} line={line} target={target} />
      ))}
    </ul>
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
  const headline = spend ? `${spend.used} of ${spend.budget} steps used` : WORKING
  return refused === 0 ? headline : `${headline}, ${refused} refused`
}

// What a turn says before its first charge lands. The setup lines publish
// ahead of the first model call, so a count here would show for a moment and
// then be replaced by the budget, which reads as the number correcting itself.
// A restored record written before the spend was published shows it too, and a
// finished turn that says only this is one whose spend went unrecorded.
const WORKING = 'working'
