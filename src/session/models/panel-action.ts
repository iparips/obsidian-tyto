import { FailureStep } from '../../shared/models/outcome'

// Everything that moves the panel on: the user's own actions, and what a turn
// reports as it runs. One union, so the reducer's switch is exhaustive.
export type PanelAction =
  | { type: 'recordingStarted' }
  | { type: 'stopRequested' }
  | { type: 'cancelled' }
  | { type: 'transcript'; text: string }
  | { type: 'summary'; text: string }
  // retryable is the hook saying it is still holding the audio, which only a
  // transcription failure has behind it.
  | { type: 'failed'; step: FailureStep; message: string; retryable?: boolean }
  | { type: 'instructions'; text: string }
  | { type: 'warned'; text: string }
  // The path the session moved to, or null when the last note closed.
  | { type: 'retargeted'; path: string | null }
  | { type: 'stepTaken'; label: string; detail: string; refused: boolean }
  | { type: 'answer'; text: string; sources: string[] }
  | { type: 'cancelRequested' }
  | { type: 'turnCancelled'; notesWritten: readonly string[] }
  | { type: 'choiceRequested'; candidates: string[]; purpose: string }
  // The path the user picked, or null when they declined every candidate.
  | { type: 'choiceAnswered'; chosen: string | null }
  | { type: 'questionAsked'; text: string; suggestions: string[] }
  | { type: 'questionAnswered' }
