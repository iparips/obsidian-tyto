import { useReducer, useState } from 'react'
import { Outcome } from '../../shared/models/outcome'
import { HistoryList } from './HistoryList'
import { Entry, INITIAL_PANEL_STATE, PanelReducer } from '../models/panel-state'
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
import { OwlSettings } from '../../settings/settings'
import { TranscriptSource } from '../transcript/models/transcript-source'
import { TranscriptDocument } from '../transcript/transcript-document'

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
  settings?: OwlSettings
  // What the panel cannot see: the chat history the recorded steps index into,
  // and what each of those steps was sent. Absent until the setting is on.
  transcriptOf?(entries: readonly Entry[]): TranscriptSource
}

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, INITIAL_PANEL_STATE)
  const asking = state.phase === 'asking'
  const [draft, setDraft] = useState('')
  const settings = props.settings
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

  // Built at the click rather than held: the entries are the reducer's, and a
  // document rebuilt per render would be thrown away every step.
  const transcriptOf = props.transcriptOf
  const copyTranscript =
    settings?.transcriptCopyEnabled && transcriptOf
      ? () => TranscriptDocument.write(transcriptOf(state.entries))
      : undefined

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
        onCopy={copyTranscript}
        hasEntries={state.entries.length > 0}
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
