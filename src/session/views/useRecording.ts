import { useRef } from 'react'
import { Attempt, Outcome } from '../../shared/models/outcome'
import { Utterance } from '../../capture/recorder'
import { PanelAction } from '../models/panel-action'
import { Phase } from '../models/panel-state'

export interface RecorderPort {
  start(): Promise<Outcome<void>>
  stop(): Promise<Utterance>
  cancel(): void
}

export interface RecordingPorts {
  recorder: RecorderPort
  // An Attempt rather than an Outcome: cancelling a recording discards it here
  // rather than reaching the transcription, so this call never comes back
  // cancelled.
  transcribe(blob: Blob, mimeType: string): Promise<Attempt<string>>
  // The plugin owns the listener so Obsidian detaches it on unload.
  onHidden?(listener: () => void): () => void
  notify?(message: string): void
}

export interface Recording {
  start(): Promise<void>
  stop(): Promise<void>
  cancel(): void
  discardOnBackground(): void
}

// Capturing an utterance and turning it into text, which is the half of the
// panel that never touches a turn.
export const useRecording = (
  ports: RecordingPorts,
  phase: Phase,
  dispatch: (action: PanelAction) => void,
  runTurn: (text: string) => Promise<void>,
): Recording => {
  const cancel = () => {
    ports.recorder.cancel()
    dispatch({ type: 'cancelled' })
  }

  // Read through a ref so the listener subscribes once, not once per render.
  const discardOnBackground = useRef(() => {})
  discardOnBackground.current = () => {
    if (phase !== 'recording') return
    cancel()
    ports.notify?.('Recording discarded: Owl cannot record in the background.')
  }

  return {
    cancel,
    discardOnBackground: () => discardOnBackground.current(),
    start: async () => {
      const outcome = await ports.recorder.start()
      if (outcome.hasFailed())
        dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
      else dispatch({ type: 'recordingStarted' })
    },
    stop: async () => {
      dispatch({ type: 'stopRequested' })
      const utterance = await ports.recorder.stop()
      const transcript = await ports.transcribe(utterance.blob, utterance.mimeType)
      if (transcript.hasFailed())
        dispatch({ type: 'failed', step: transcript.step, message: transcript.message })
      else await runTurn(transcript.value)
    },
  }
}
