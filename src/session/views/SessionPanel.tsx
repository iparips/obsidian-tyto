import { useEffect, useReducer, useState } from 'react'
import { Outcome } from '../../shared/models/outcome'
import { HistoryList } from './HistoryList'
import { AskedEntries } from '../models/asked-entries'
import { Entry, PanelReducer, PanelState } from '../models/panel-state'
import { TurnEndingKind } from '../../engine/turn/turn-ending-kind'
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
import { TytoSettings } from '../../settings/settings'
import { StoredSession } from '../models/stored-session'
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
  // A turn's end reaches the plugin two ways, and they are not the same thing.
  // These two are notices: only the plugin knows whether the panel is on
  // screen, so it decides what a turn is worth telling the user (FR22, FR23).
  // Each carries what its notice says, and a cancel calls neither, because the
  // user stopped it and already knows.
  notifySucceeded?(summary: string): void
  notifyFailed?(message: string): void
  // onTurnEnded is the other, and is a record rather than a notice: it fires on
  // every ending, the cancel included, and carries no message because nothing
  // is being said.
  //
  // Three of the five kinds reach it. The panel reads an Outcome, and
  // TurnOutcomes builds Exhausted and Stuck as the same chat failure, so both
  // arrive as Failed. The transcript records the true kind from the engine.
  //
  // The entries travel with it because the reducer owns them, as they do for
  // transcriptOf: the plugin writes the record and cannot see what the panel
  // holds.
  onTurnEnded?(ending: TurnEndingKind, entries: readonly Entry[]): void
  // The record the plugin writes, assembled from the entries the panel holds
  // and the history only the builder can reach. Required, because SessionBuilder
  // always supplies it and an optional one puts a branch in the plugin that
  // cannot happen.
  buildStoredSessionFromEntries(entries: readonly Entry[]): StoredSession
  // What a restored session already holds, empty for a session that starts
  // fresh. Settled and set idle on the way in, since no turn is running after
  // a load (FR5, FR6).
  entries?: Entry[]
  settings?: TytoSettings
  // What the panel cannot see: the chat history the recorded steps index into,
  // and what each of those steps was sent. Absent until the setting is on.
  transcriptOf?(entries: readonly Entry[]): TranscriptSource
}

// The stored phase is never read: the turn that set a running phase went with
// the WebView, so a restored session opens idle whatever it was doing (FR5).
// turnEnded settles the entries and carries the phase through unchanged,
// because every caller in the reducer sets the phase itself, so idle is set
// here rather than by it.
const restoredState = (entries: Entry[]): PanelState =>
  AskedEntries.turnEnded(new PanelState('idle', entries))

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, props.entries ?? [], restoredState)
  const asking = state.phase === 'asking'
  const [draft, setDraft] = useState('')
  // Held for one render, so the ending is reported with the entries it left
  // rather than the ones the turn started on.
  const [ending, setEnding] = useState<TurnEndingKind | null>(null)
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
      setEnding(TurnEndingKind.Replied)
    } else if (outcome.wasCancelled()) {
      dispatch({ type: 'turnCancelled', notesWritten: outcome.notesWritten })
      setEnding(TurnEndingKind.Cancelled)
    } else {
      dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
      props.notifyFailed?.(outcome.message)
      setEnding(TurnEndingKind.Failed)
    }
  }

  // Reported after the render the ending's own dispatch produced, so the
  // entries the plugin writes include the summary or error that ended the turn.
  // Reading state.entries inside runTurn would read the render it started on
  // and drop that last entry.
  useEffect(() => {
    if (!ending) return
    setEnding(null)
    props.onTurnEnded?.(ending, state.entries)
  }, [ending])

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
