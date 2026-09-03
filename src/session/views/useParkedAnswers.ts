import { useEffect, useRef } from 'react'
import { PanelAction } from '../models/panel-action'

export interface QuestionRequest {
  question: string
  suggestions: readonly string[]
}

export interface ParkedAnswerPorts {
  onOpenRequested?(listener: (path: string) => Promise<boolean>): () => void
  onQuestionAsked?(listener: (request: QuestionRequest) => Promise<string>): () => void
}

export interface ParkedAnswers {
  settleOpen(granted: boolean): void
  settleQuestion(answer: string): void
}

// The two promises a parked turn is waiting on, held rather than dispatched
// because the engine is awaiting them: the reducer renders what was asked, and
// these settle what is behind it (NFR6).
export const useParkedAnswers = (
  ports: ParkedAnswerPorts,
  dispatch: (action: PanelAction) => void,
): ParkedAnswers => {
  const answerOpen = useRef<((granted: boolean) => void) | null>(null)
  const answerQuestion = useRef<((answer: string) => void) | null>(null)

  useEffect(
    () =>
      ports.onOpenRequested?.((path) => {
        dispatch({ type: 'openRequested', path })
        return new Promise<boolean>((resolve) => (answerOpen.current = resolve))
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
    settleOpen: (granted) =>
      settle(answerOpen, granted, () => dispatch({ type: 'openAnswered', granted })),
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
