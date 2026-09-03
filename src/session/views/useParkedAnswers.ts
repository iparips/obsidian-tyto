import { useEffect, useRef } from 'react'
import { PanelAction } from '../models/panel-action'

// What the engine parks on: which notes it found, and what the pick is for.
export interface ChoiceRequest {
  candidates: readonly string[]
  purpose: string
}

export interface QuestionRequest {
  question: string
  suggestions: readonly string[]
}

export interface ParkedAnswerPorts {
  onChoiceRequested?(listener: (request: ChoiceRequest) => Promise<string | null>): () => void
  onQuestionAsked?(listener: (request: QuestionRequest) => Promise<string>): () => void
}

export interface ParkedAnswers {
  // A path when the user picked one, null when they declined every candidate.
  settleChoice(chosen: string | null): void
  settleQuestion(answer: string): void
}

// The two promises a parked turn is waiting on, held rather than dispatched
// because the engine is awaiting them: the reducer renders what was asked, and
// these settle what is behind it (NFR6).
export const useParkedAnswers = (
  ports: ParkedAnswerPorts,
  dispatch: (action: PanelAction) => void,
): ParkedAnswers => {
  const answerChoice = useRef<((chosen: string | null) => void) | null>(null)
  const answerQuestion = useRef<((answer: string) => void) | null>(null)

  useEffect(
    () =>
      ports.onChoiceRequested?.((request) => {
        dispatch({
          type: 'choiceRequested',
          candidates: [...request.candidates],
          purpose: request.purpose,
        })
        return new Promise<string | null>((resolve) => (answerChoice.current = resolve))
      }),
    [],
  )

  useEffect(
    () =>
      ports.onQuestionAsked?.((request) => {
        dispatch({
          type: 'questionAsked',
          text: request.question,
          suggestions: [...request.suggestions],
        })
        return new Promise<string>((resolve) => (answerQuestion.current = resolve))
      }),
    [],
  )

  // Settled rather than left hanging: an unsettled promise parks the loop and
  // the session never returns to idle (FR29).
  return {
    settleChoice: (chosen) =>
      settle(answerChoice, chosen, () => dispatch({ type: 'choiceAnswered', chosen })),
    settleQuestion: (answer) =>
      settle(answerQuestion, answer, () => dispatch({ type: 'questionAnswered' })),
  }
}

const settle = <T>(
  held: { current: ((value: T) => void) | null },
  value: T,
  report: () => void,
): void => {
  const resolve = held.current
  if (!resolve) return
  held.current = null
  report()
  resolve(value)
}
