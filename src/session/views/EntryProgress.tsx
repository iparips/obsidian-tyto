import { ProgressLine } from '../models/panel-state'

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

// A direct write says so on the line that made it, where a warning below the
// list named neither the edit it belonged to nor the note it reached.
//
// The note shows only where it differs from the turn's target, since the turn
// names its target at the top (D2). A direct write always names it: that edit
// is the one the user may need to undo by hand.
const ProgressRow = ({ line, target }: { line: ProgressLine; target: string | null }) => (
  <li className={line.refused ? 'tyto-progress-refused' : undefined}>
    <span className="tyto-progress-label">{line.label}</span>
    <span className="tyto-progress-detail">{line.detail}</span>
    {line.wroteDirect && (
      <>
        <span className="tyto-progress-detail tyto-progress-directly">directly.</span>
        <span className="tyto-progress-direct">
          Undo not available - because editor moved to another note
        </span>
      </>
    )}
    {line.note !== null && (line.wroteDirect || line.note !== target) && (
      <div className="tyto-progress-note">{line.note}</div>
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
