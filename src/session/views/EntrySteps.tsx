import { PanelStep } from '../models/panel-state'

// Collapsed by default, like the resolved commands in settings: the reply is
// what the user reads, and how the turn got there is a check they open when a
// turn surprises them.
export const EntrySteps = ({ steps }: { steps: PanelStep[] }) => (
  <details className="owl-entry-steps">
    <summary>{summaryOf(steps)}</summary>
    <ol aria-label="Turn steps">
      {steps.map((step, index) => (
        <li key={index} className={step.refused ? 'owl-step-refused' : undefined}>
          <span className="owl-step-label">{step.label}</span>
          <span className="owl-step-detail">{step.detail}</span>
        </li>
      ))}
    </ol>
  </details>
)

// The refusal count is in the summary because it is the reason to open the
// list: a turn that refused nothing rarely needs explaining.
const summaryOf = (steps: PanelStep[]): string => {
  const refused = steps.filter((step) => step.refused).length
  const count = `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`
  return refused === 0 ? count : `${count}, ${refused} refused`
}
