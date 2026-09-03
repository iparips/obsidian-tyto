import { useEffect, useReducer, useState } from 'react'
import { Outcome } from '../../shared/models/outcome'
import { HistoryList } from './HistoryList'
import { INITIAL_PANEL_STATE, PanelReducer } from '../models/panel-state'
import { AnswerReport, StepReport } from '../session-listeners'
import { PanelHeader } from './PanelHeader'
import { ParkedAnswerPorts, QuestionRequest, useParkedAnswers } from './useParkedAnswers'
import { RecorderPort, RecordingPorts, useRecording } from './useRecording'
import { InputRow } from './InputRow'

export type { QuestionRequest, RecorderPort }

export interface SessionPanelProps extends ParkedAnswerPorts, RecordingPorts {
  // Null while the session is unbound, which the header says rather than naming
  // a note.
  noteName: string | null
  // The path from the vault root, beneath the name, so two notes sharing a name
  // are told apart (FR14).
  notePath?: string | null
  processUtterance(text: string): Promise<Outcome<string>>
  // The engine owns the running turn's cancellation, so the panel asks rather
  // than holding it.
  cancelTurn?(): void
  startNewSession?(): void
  // The plugin owns the subscription, as with onHidden, so the engine reports a
  // resolved chain without knowing the panel.
  onInstructions?(listener: (text: string) => void): () => void
  onCommandRun?(listener: (text: string) => void): () => void
  // Said once as a turn nears its cap, so a user watching can stop it rather
  // than waiting for it to fail.
  onWarning?(listener: (text: string) => void): () => void
  // Every step the turn takes, collected into one collapsed entry, so a turn
  // that goes nowhere can still be inspected.
  onStep?(listener: (step: StepReport) => void): () => void
  onAnswer?(listener: (report: AnswerReport) => void): () => void
  onTargetNoteChanged?(listener: (path: string) => void): () => void
  // Only the plugin knows whether the panel is on screen, so it decides what a
  // finished or failed turn is worth telling the user (FR22, FR23).
  onTurnFinished?(summary: string): void
  onTurnFailed?(message: string): void
}

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, INITIAL_PANEL_STATE)
  const asking = state.phase === 'asking'
  const [draft, setDraft] = useState('')
  const [targetName, setTargetName] = useState(props.noteName)
  const [targetPath, setTargetPath] = useState(props.notePath ?? null)
  // The engine asks through these and awaits the answer, so a parked turn is a
  // promise the panel settles rather than a channel the publisher lacks.
  const { settleOpen, settleQuestion } = useParkedAnswers(props, dispatch)

  // A cancelled turn tells nobody: the user is the one who stopped it, so they
  // already know (FR28).
  const runTurn = async (text: string) => {
    dispatch({ type: 'transcript', text })
    const outcome = await props.processUtterance(text)
    if (outcome.succeeded()) {
      dispatch({ type: 'summary', text: outcome.value })
      props.onTurnFinished?.(outcome.value)
    } else if (outcome.wasCancelled())
      dispatch({ type: 'turnCancelled', writtenNotes: outcome.writtenNotes })
    else {
      dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
      props.onTurnFailed?.(outcome.message)
    }
  }

  const recorded = useRecording(props, state.phase, dispatch, runTurn)

  // One control for both, because cancel means the same either way: stop, and
  // keep nothing.
  const cancel = () => {
    if (state.phase === 'recording') return recorded.cancel()
    settleOpen(false)
    settleQuestion('')
    dispatch({ type: 'cancelRequested' })
    props.cancelTurn?.()
  }

  useEffect(() => props.onHidden?.(() => recorded.discardOnBackground()), [])

  useEffect(() => props.onInstructions?.((text) => dispatch({ type: 'instructions', text })), [])

  useEffect(() => props.onCommandRun?.((text) => dispatch({ type: 'commandRan', text })), [])

  useEffect(() => props.onWarning?.((text) => dispatch({ type: 'warned', text })), [])

  useEffect(
    () =>
      props.onStep?.((step) =>
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
      props.onAnswer?.((report) =>
        dispatch({ type: 'answer', text: report.text, sources: report.sources }),
      ),
    [],
  )

  // The header names the note the edit tools now target, which a command may
  // have moved mid-turn (FR19).
  useEffect(
    () =>
      props.onTargetNoteChanged?.((path) => {
        setTargetName(noteNameOf(path))
        setTargetPath(path)
      }),
    [],
  )

  // The input row answers the question rather than starting a turn while one is
  // asking, which is the one place a running phase accepts typing (FR18).
  const sendDraft = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    if (asking) return settleQuestion(text)
    await runTurn(text)
  }

  return (
    <div className="owl-panel">
      <PanelHeader
        name={targetName}
        path={targetPath}
        running={state.phase !== 'idle'}
        onReset={props.startNewSession}
      />
      <HistoryList
        entries={state.entries}
        phase={state.phase}
        onAnswerOpen={settleOpen}
        onPickSuggestion={setDraft}
      />
      <InputRow
        phase={state.phase}
        draft={draft}
        onDraftChange={setDraft}
        onSend={sendDraft}
        onCancel={cancel}
        onRecord={recorded.start}
        onStopRecording={recorded.stop}
      />
    </div>
  )
}

const noteNameOf = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
