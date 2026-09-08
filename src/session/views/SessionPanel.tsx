import { useReducer, useState } from 'react'
import { Outcome } from '../../shared/models/outcome'
import { HistoryList } from './HistoryList'
import { INITIAL_PANEL_STATE, PanelReducer } from '../models/panel-state'
import { PanelHeader } from './PanelHeader'
import {
  ChoiceRequest,
  ParkedAnswerPorts,
  QuestionRequest,
  useParkedAnswers,
} from './useParkedAnswers'
import { RecorderPort, RecordingPorts, useRecording } from './useRecording'
import { EngineEventPorts, useEngineEvents } from './useEngineEvents'
import { TargetNotePorts, useTargetNote } from './useTargetNote'
import { InputRow } from './InputRow'

export type { ChoiceRequest, QuestionRequest, RecorderPort }

export interface SessionPanelProps
  extends ParkedAnswerPorts, RecordingPorts, EngineEventPorts, TargetNotePorts {
  processUtterance(text: string): Promise<Outcome<string>>
  // The engine owns the running turn's cancellation, so the panel asks rather
  // than holding it.
  cancelTurn?(): void
  startNewSession?(): void
  // Only the plugin knows whether the panel is on screen, so it decides what a
  // finished or failed turn is worth telling the user (FR22, FR23).
  onTurnFinished?(summary: string): void
  onTurnFailed?(message: string): void
}

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, INITIAL_PANEL_STATE)
  const asking = state.phase === 'asking'
  const [draft, setDraft] = useState('')
  const targetNote = useTargetNote(props)
  // The engine asks through these and awaits the answer, so a parked turn is a
  // promise the panel settles rather than a channel the publisher lacks.
  const { settleChoice, settleQuestion } = useParkedAnswers(props, dispatch)

  // A cancelled turn tells nobody: the user is the one who stopped it, so they
  // already know (FR28).
  const runTurn = async (text: string) => {
    dispatch({ type: 'transcript', text })
    const outcome = await props.processUtterance(text)
    if (outcome.succeeded()) {
      dispatch({ type: 'summary', text: outcome.value })
      props.onTurnFinished?.(outcome.value)
    } else if (outcome.wasCancelled())
      dispatch({ type: 'turnCancelled', notesWritten: outcome.notesWritten })
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
    settleChoice(null)
    settleQuestion('')
    dispatch({ type: 'cancelRequested' })
    props.cancelTurn?.()
  }

  useEngineEvents(props, dispatch, () => recorded.discardOnBackground())

  // A suggestion is a whole answer, so clicking one submits it rather than
  // filling the box: the user picked it to avoid typing, and leaving it as a
  // draft asks them to press send to confirm a choice they already made.
  const pickSuggestion = async (suggestion: string) => {
    if (asking) return settleQuestion(suggestion)
    setDraft('')
    await runTurn(suggestion)
  }

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
        name={targetNote.name}
        path={targetNote.path}
        running={state.phase !== 'idle'}
        onReset={props.startNewSession}
      />
      <HistoryList
        entries={state.entries}
        phase={state.phase}
        onChooseNote={settleChoice}
        onPickSuggestion={pickSuggestion}
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
