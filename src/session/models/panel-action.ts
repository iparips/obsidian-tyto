import { FailureStep } from '../../shared/models/outcome'

// Everything that moves the panel on: the user's own actions, and what a turn
// reports as it runs. One union, so the reducer's switch is exhaustive.
export type PanelAction =
  | { type: 'recordingStarted' }
  | { type: 'stopRequested' }
  | { type: 'cancelled' }
  | { type: 'transcript'; text: string }
  | { type: 'summary'; text: string }
  | { type: 'failed'; step: FailureStep; message: string }
  | { type: 'instructions'; text: string }
  | { type: 'commandRan'; text: string }
  | { type: 'warned'; text: string }
  | { type: 'stepTaken'; label: string; detail: string; refused: boolean }
  | { type: 'answer'; text: string; sources: string[] }
  | { type: 'cancelRequested' }
  | { type: 'turnCancelled'; writtenNotes: readonly string[] }
  | { type: 'choiceRequested'; candidates: string[]; purpose: string }
  // The path the user picked, or null when they declined every candidate.
  | { type: 'choiceAnswered'; chosen: string | null }
  | { type: 'questionAsked'; text: string; suggestions: string[] }
  | { type: 'questionAnswered' }
