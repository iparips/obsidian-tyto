import { ReactNode } from 'react'
import { Phase } from '../models/panel-state'

export interface InputRowProps {
  phase: Phase
  // Takes the instruction field's place while recording, so the row keeps its
  // shape and the buttons stay under the thumb that reached for them.
  recordingStrip?: ReactNode
  draft: string
  onDraftChange(text: string): void
  onSend(): void
  onCancel(): void
  onRecord(): void
  onStopRecording(): void
}

// The row stays live while asking, unlike every other running phase: the user
// answers the question through it (FR18).
export const InputRow = (props: InputRowProps) => {
  const recording = props.phase === 'recording'
  const running = props.phase !== 'idle'
  return (
    <div className="tyto-input-row">
      <button
        aria-label={recording ? 'Stop recording' : 'Record'}
        // The live state in the row the thumb is already on, so a user looking
        // at the input does not have to look up at the strip.
        className={recording ? 'tyto-recording-button' : undefined}
        disabled={running && !recording}
        onClick={recording ? props.onStopRecording : props.onRecord}
      >
        {recording ? 'Stop' : 'Mic'}
      </button>
      {recording ? (
        props.recordingStrip
      ) : (
        <input
          aria-label="Instruction"
          value={props.draft}
          disabled={running && props.phase !== 'asking'}
          onChange={(event) => props.onDraftChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && props.onSend()}
        />
      )}
      {running ? (
        // Clickable until it is clicked, which is what stops a second click
        // reaching a turn that is already stopping.
        <button
          aria-label="Cancel"
          disabled={props.phase === 'cancelling'}
          onClick={props.onCancel}
        >
          Cancel
        </button>
      ) : (
        <button aria-label="Send" onClick={props.onSend}>
          Send
        </button>
      )}
    </div>
  )
}
