import { useEffect } from 'react'
import { PanelAction } from '../../models/panel-action'
import { AnswerReport, StepReport } from '../../session-listeners'

// What the engine reports as a turn runs. Each is a subscription returning its
// own unsubscribe, so the panel holds none of them.
export interface EngineEventPorts {
  onObsidianBackgrounded?(listener: () => void): () => void
  // The plugin owns the subscription, so the engine reports a resolved chain
  // without knowing the panel.
  onInstructions?(listener: (text: string) => void): () => void
  // Said once as a turn nears its cap, so a user watching can stop it rather
  // than waiting for it to fail.
  onWarning?(listener: (text: string) => void): () => void
  // Every step the turn takes, collected into one collapsed entry, so a turn
  // that goes nowhere can still be inspected.
  onStep?(listener: (step: StepReport) => void): () => void
  onAnswer?(listener: (report: AnswerReport) => void): () => void
}

// Five subscriptions the panel only forwards to the reducer, wired once. They
// share a shape, so listing them here leaves the component holding the state
// and the markup rather than the plumbing.
export const useEngineEvents = (
  ports: EngineEventPorts,
  dispatch: (action: PanelAction) => void,
  endRecording: () => void,
): void => {
  useEffect(() => ports.onObsidianBackgrounded?.(endRecording), [])

  useEffect(() => ports.onInstructions?.((text) => dispatch({ type: 'instructions', text })), [])

  useEffect(() => ports.onWarning?.((text) => dispatch({ type: 'warned', text })), [])

  useEffect(
    () =>
      ports.onStep?.((step) =>
        dispatch({
          type: 'stepTaken',
          label: step.label,
          detail: step.detail,
          refused: step.refused,
        }),
      ),
    [],
  )

  useEffect(
    () =>
      ports.onAnswer?.((report) =>
        dispatch({ type: 'answer', text: report.text, sources: report.sources }),
      ),
    [],
  )
}
