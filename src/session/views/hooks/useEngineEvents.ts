import { useEffect } from 'react'
import { PanelAction } from '../../models/panel-action'
import { AnswerReport, RetargetReport, ProgressLineReport } from '../../session-listeners'

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
  onProgressLine?(listener: (step: ProgressLineReport) => void): () => void
  onAnswer?(listener: (report: AnswerReport) => void): () => void
  // A tool's move sets the open turn's target. The user's own move belongs to
  // no turn and the turn's target says what it used to, so nothing shows it.
  onTargetNoteChanged?(listener: (report: RetargetReport) => void): () => void
}

// Six subscriptions the panel only forwards to the reducer, wired once. They
// share a shape, so listing them here leaves the component holding the state
// and the markup rather than the plumbing.
export const useEngineEvents = (
  ports: EngineEventPorts,
  dispatchFn: (action: PanelAction) => void,
  endRecordingFn: () => void,
): void => {
  useEffect(() => ports.onObsidianBackgrounded?.(endRecordingFn), [])

  useEffect(() => ports.onInstructions?.((text) => dispatchFn({ type: 'instructions', text })), [])

  useEffect(() => ports.onWarning?.((text) => dispatchFn({ type: 'warned', text })), [])

  useEffect(
    () =>
      ports.onProgressLine?.((step) =>
        dispatchFn({
          type: 'progressLine',
          label: step.label,
          detail: step.detail,
          refused: step.refused,
          note: step.note,
          wroteDirect: step.wroteDirect,
        }),
      ),
    [],
  )

  useEffect(
    () =>
      ports.onAnswer?.((report) =>
        dispatchFn({ type: 'answer', text: report.text, sources: report.sources }),
      ),
    [],
  )

  useEffect(
    () =>
      ports.onTargetNoteChanged?.((report) => {
        // The user's move sets where the next turn starts, which useTargetNote
        // reads off the channel. Only a tool's move belongs to the open turn.
        if (report.byUser) return
        dispatchFn({ type: 'targetMoved', path: report.path })
      }),
    [],
  )
}
