import { useEffect, useRef } from 'react'
import { Attempt, Outcome } from '../../../shared/models/outcome'
import { Utterance } from '../../../recorder'
import { PanelAction } from '../../models/panel-action'
import { Phase } from '../../models/panel-state'

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
  onObsidianBackgrounded?(listener: () => void): () => void
}

export interface Recording {
  start(): Promise<void>
  stop(): Promise<void>
  cancel(): void
  retry(): Promise<void>
  sendOnBackground(): void
}

// Capturing an utterance and turning it into text, which is the half of the
// panel that never touches a turn.
export const useRecording = (
  ports: RecordingPorts,
  phase: Phase,
  dispatchFn: (action: PanelAction) => void,
  runTurnFn: (text: string) => Promise<void>,
): Recording => {
  // The last utterance, so a failed transcription costs a click rather than the
  // recording. One at a time: the retry is for the recording just made.
  const held = useRef<Utterance | null>(null)

  const cancel = () => {
    ports.recorder.cancel()
    held.current = null
    dispatchFn({ type: 'cancelled' })
  }

  const stop = async () => {
    dispatchFn({ type: 'stopRequested' })
    held.current = await ports.recorder.stop()
    await transcribe(held.current)
  }

  const retry = async () => {
    const utterance = held.current
    if (!utterance) return
    dispatchFn({ type: 'stopRequested' })
    await transcribe(utterance)
  }

  // Held until a transcript comes back, so every failure keeps something to
  // retry and a success is what releases it.
  const transcribe = async (utterance: Utterance) => {
    const transcript = await ports.transcribe(utterance.blob, utterance.mimeType)
    if (transcript.hasFailed())
      return dispatchFn({
        type: 'failed',
        step: transcript.step,
        message: transcript.message,
        retryable: true,
      })
    held.current = null
    await runTurnFn(transcript.value)
  }

  // Anything that ends a recording other than the user sends what it captured:
  // the OS interrupting a dictation is not the user choosing to lose it.
  // Read through a ref so the listener subscribes once, not once per render.
  const endRecording = useRef(() => {})
  endRecording.current = () => {
    if (phase !== 'recording') return
    void stop()
  }

  // Closing the panel unmounts without releasing the stream, so without this
  // the microphone stays open with the audio reachable by nothing.
  useEffect(() => () => endRecording.current(), [])

  return {
    cancel,
    stop,
    retry,
    sendOnBackground: () => endRecording.current(),
    start: async () => {
      const outcome = await ports.recorder.start()
      if (outcome.hasFailed())
        return dispatchFn({ type: 'failed', step: outcome.step, message: outcome.message })
      // Recording again is what drops the previous utterance, so the control
      // above it goes with the audio it would have retried.
      held.current = null
      dispatchFn({ type: 'recordingStarted' })
    },
  }
}
