import { useState } from 'react'
import { Outcome } from '../../shared/models/outcome'
import { HistoryList } from './HistoryList'
import { PanelEntry } from '../models/panel-state'
import { PanelHeader } from './PanelHeader'
import {
  ChoiceRequest,
  ParkedAnswerPorts,
  QuestionRequest,
  useParkedAnswers,
} from './hooks/useParkedAnswers'
import { RecorderPort, RecordingPorts, useRecording } from './hooks/useRecording'
import { useRecordingLevel } from './hooks/useRecordingLevel'
import { EngineEventPorts, useEngineEvents } from './hooks/useEngineEvents'
import { RecordedHistoryPorts, useRecordedHistory } from './hooks/useRecordedHistory'
import { TargetNotePorts, useTargetNote } from './hooks/useTargetNote'
import { InputRow } from './InputRow'
import { RecordingStrip } from './RecordingStrip'
import { TytoSettings } from '../../settings/settings'
import { TranscriptSource } from '../transcript/models/transcript-source'
import { TranscriptDocument } from '../transcript/transcript-document'

export type { ChoiceRequest, QuestionRequest, RecorderPort }

export interface SessionPanelProps
  extends
    ParkedAnswerPorts,
    RecordingPorts,
    EngineEventPorts,
    TargetNotePorts,
    RecordedHistoryPorts {
  processUtterance(text: string): Promise<Outcome<string>>
  // The engine owns the running turn's cancellation, so the panel asks rather
  // than holding it.
  cancelTurn?(): void
  startNewSession?(): void
  // Notices rather than records: only the plugin knows whether the panel is on
  // screen, so it decides what a turn is worth telling the user (FR22, FR23).
  // Each carries what its notice says, and a cancel calls neither, because the
  // user stopped it and already knows. The record is the recorder's, and
  // follows the history rather than the turn's end.
  notifySucceeded?(summary: string): void
  notifyFailed?(message: string): void
  // What a restored session already holds, empty for a session that starts
  // fresh. Settled and set idle on the way in, since no turn is running after
  // a load (FR5, FR6).
  entries?: PanelEntry[]
  settings?: TytoSettings
  // What the panel cannot see: the chat history the recorded steps index into,
  // and what each of those steps was sent. Absent until the setting is on.
  transcriptOf?(entries: readonly PanelEntry[]): TranscriptSource
}

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useRecordedHistory(props, props.entries ?? [])
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
      props.notifySucceeded?.(outcome.value)
    } else if (outcome.wasCancelled()) {
      dispatch({ type: 'turnCancelled', notesWritten: outcome.notesWritten })
    } else {
      dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
      props.notifyFailed?.(outcome.message)
    }
  }

  const recorded = useRecording(props, state.phase, dispatch, runTurn)
  const recordingLevel = useRecordingLevel(() => props.recorder.stream())

  // Opened here rather than inside the hook's own effect, so the audio context
  // is built in the gesture WebKit requires it to be built in.
  const record = async () => {
    recordingLevel.begin()
    await recorded.start()
  }

  // One control for both, because cancel means the same either way: stop, and
  // keep nothing.
  const cancel = () => {
    if (state.phase === 'recording') return recorded.cancel()
    settleChoice(null)
    settleQuestion('')
    dispatch({ type: 'cancelRequested' })
    props.cancelTurn?.()
  }

  useEngineEvents(props, dispatch, () => recorded.sendOnBackground())

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
    <div className="tyto-panel">
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
        onRetry={recorded.retry}
      />
      <InputRow
        phase={state.phase}
        recordingStrip={
          <RecordingStrip
            phase={state.phase}
            levels={recordingLevel.levels}
            elapsedSeconds={recordingLevel.elapsedSeconds}
          />
        }
        draft={draft}
        onDraftChange={setDraft}
        onSend={sendDraft}
        onCancel={cancel}
        onRecord={record}
        onStopRecording={recorded.stop}
      />
    </div>
  )
}
