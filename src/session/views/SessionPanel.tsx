import { useEffect, useReducer, useRef, useState } from 'react'
import { Attempt, Outcome } from '../../shared/models/outcome'
import { Utterance } from '../../capture/recorder'
import { HistoryList } from './HistoryList'
import { INITIAL_PANEL_STATE, PanelReducer } from '../models/panel-state'
import { AnswerReport } from '../session-listeners'

export interface RecorderPort {
  start(): Promise<Outcome<void>>
  stop(): Promise<Utterance>
  cancel(): void
}

export interface SessionPanelProps {
  // Null while the session is unbound, which the header says rather than naming
  // a note.
  noteName: string | null
  recorder: RecorderPort
  // An Attempt rather than an Outcome: cancelling a recording discards it here
  // rather than reaching the transcription, so this call never comes back
  // cancelled.
  transcribe(blob: Blob, mimeType: string): Promise<Attempt<string>>
  processUtterance(text: string): Promise<Outcome<string>>
  // The engine owns the running turn's cancellation, so the panel asks rather
  // than holding it.
  cancelTurn?(): void
  // The plugin owns the listener so Obsidian detaches it on unload.
  onHidden?(listener: () => void): () => void
  notify?(message: string): void
  startNewSession?(): void
  // The plugin owns the subscription, as with onHidden, so the engine reports a
  // resolved chain without knowing the panel.
  onInstructions?(listener: (text: string) => void): () => void
  onCommandRun?(listener: (text: string) => void): () => void
  onAnswer?(listener: (report: AnswerReport) => void): () => void
  onTargetNoteChanged?(listener: (path: string) => void): () => void
}

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, INITIAL_PANEL_STATE)
  const [draft, setDraft] = useState('')
  const [targetName, setTargetName] = useState(props.noteName)

  const runTurn = async (text: string) => {
    dispatch({ type: 'transcript', text })
    const outcome = await props.processUtterance(text)
    if (outcome.succeeded()) dispatch({ type: 'summary', text: outcome.value })
    else if (outcome.wasCancelled())
      dispatch({ type: 'turnCancelled', writtenNotes: outcome.writtenNotes })
    else dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
  }

  const startRecording = async () => {
    const outcome = await props.recorder.start()
    if (outcome.hasFailed())
      dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
    else dispatch({ type: 'recordingStarted' })
  }

  const stopRecording = async () => {
    dispatch({ type: 'stopRequested' })
    const utterance = await props.recorder.stop()
    const transcript = await props.transcribe(utterance.blob, utterance.mimeType)
    if (transcript.hasFailed())
      dispatch({ type: 'failed', step: transcript.step, message: transcript.message })
    else await runTurn(transcript.value)
  }

  const cancelRecording = () => {
    props.recorder.cancel()
    dispatch({ type: 'cancelled' })
  }

  // One control for both, because cancel means the same either way: stop, and
  // keep nothing.
  const cancel = () => {
    if (state.phase === 'recording') return cancelRecording()
    dispatch({ type: 'cancelRequested' })
    props.cancelTurn?.()
  }

  // Read through a ref so the listener subscribes once, not once per render.
  const discardOnBackground = useRef(() => {})
  discardOnBackground.current = () => {
    if (state.phase !== 'recording') return
    cancelRecording()
    props.notify?.('Recording discarded: Owl cannot record in the background.')
  }

  useEffect(() => props.onHidden?.(() => discardOnBackground.current()), [])

  useEffect(() => props.onInstructions?.((text) => dispatch({ type: 'instructions', text })), [])

  useEffect(() => props.onCommandRun?.((text) => dispatch({ type: 'commandRan', text })), [])

  useEffect(
    () =>
      props.onAnswer?.((report) =>
        dispatch({ type: 'answer', text: report.text, sources: report.sources }),
      ),
    [],
  )

  // The header names the note the edit tools now target, which a command may
  // have moved mid-turn (FR19).
  useEffect(() => props.onTargetNoteChanged?.((path) => setTargetName(noteNameOf(path))), [])

  const sendDraft = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    await runTurn(text)
  }

  const recording = state.phase === 'recording'
  const running = state.phase !== 'idle'
  const busy = running && !recording
  // Clickable until it is clicked, which is what stops a second click reaching a
  // turn that is already stopping.
  const stoppable = running && state.phase !== 'cancelling'
  return (
    <div className="owl-panel">
      <div className="owl-header">
        <span className="owl-header-name">{targetName ?? NO_NOTE_BOUND}</span>
        {props.startNewSession && (
          <button
            className="owl-new-session"
            aria-label="Reset session"
            disabled={running}
            onClick={props.startNewSession}
          >
            Reset
          </button>
        )}
      </div>
      <HistoryList entries={state.entries} phase={state.phase} />
      <div className="owl-input-row">
        <button
          aria-label={recording ? 'Stop recording' : 'Record'}
          disabled={busy}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? 'Stop' : 'Mic'}
        </button>
        <input
          aria-label="Instruction"
          value={draft}
          disabled={running}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && sendDraft()}
        />
        {running ? (
          <button aria-label="Cancel" disabled={!stoppable} onClick={cancel}>
            Cancel
          </button>
        ) : (
          <button aria-label="Send" onClick={sendDraft}>
            Send
          </button>
        )}
      </div>
    </div>
  )
}

const NO_NOTE_BOUND = 'No note open'

const noteNameOf = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
