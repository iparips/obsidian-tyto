import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_PANEL_STATE, PanelReducer, PanelState } from '../models/panel-state'
import { PanelAction } from '../models/panel-action'

// The action the engine's choice sends, so a test states which notes were
// offered rather than repeating the shape at each case.
const offering = (
  candidates = ['Lists/todo.md', 'Lists/shopping.md'],
  purpose = 'add toilet paper',
): PanelAction => ({ type: 'choiceRequested', candidates, purpose })

describe('PanelReducer', () => {
  let thinking: PanelState

  beforeEach(() => {
    thinking = PanelReducer.reduce(INITIAL_PANEL_STATE, { type: 'transcript', text: 'do it' })
  })

  describe('when a cancel is requested', () => {
    it('moves to the cancelling phase', () => {
      const state = PanelReducer.reduce(thinking, { type: 'cancelRequested' })

      expect(state.phase).toBe('cancelling')
    })

    it('leaves the entries alone until the turn stops', () => {
      const state = PanelReducer.reduce(thinking, { type: 'cancelRequested' })

      expect(state.entries).toEqual(thinking.entries)
    })
  })

  describe('when the cancellation lands', () => {
    let cancelling: PanelState

    beforeEach(() => {
      cancelling = PanelReducer.reduce(thinking, { type: 'cancelRequested' })
    })

    it('returns to idle', () => {
      const state = PanelReducer.reduce(cancelling, { type: 'turnCancelled', writtenNotes: [] })

      expect(state.phase).toBe('idle')
    })

    it('appends an entry saying nothing changed when no note was written', () => {
      const state = PanelReducer.reduce(cancelling, { type: 'turnCancelled', writtenNotes: [] })

      expect(state.entries.at(-1)).toEqual({
        kind: 'cancelled',
        text: 'Stopped. Nothing was changed.',
      })
    })

    it('appends an entry naming the note when one was written', () => {
      const state = PanelReducer.reduce(cancelling, {
        type: 'turnCancelled',
        writtenNotes: ['note.md'],
      })

      expect(state.entries.at(-1)).toEqual({
        kind: 'cancelled',
        text: 'Stopped. Already changed: note.md',
      })
    })

    it('names every note when the turn wrote to more than one', () => {
      const state = PanelReducer.reduce(cancelling, {
        type: 'turnCancelled',
        writtenNotes: ['note.md', 'Journal/day.md'],
      })

      expect(state.entries.at(-1)).toEqual({
        kind: 'cancelled',
        text: 'Stopped. Already changed: note.md, Journal/day.md',
      })
    })
  })

  describe('when a recording is cancelled', () => {
    it('returns to idle without an entry, as it does today', () => {
      const recording = PanelReducer.reduce(INITIAL_PANEL_STATE, { type: 'recordingStarted' })

      const state = PanelReducer.reduce(recording, { type: 'cancelled' })

      expect(state).toEqual(new PanelState('idle', []))
    })
  })

  describe('when a shortlist is offered', () => {
    it('enters the choosing phase when a shortlist is offered', () => {
      const state = PanelReducer.reduce(thinking, offering())

      expect(state.phase).toBe('choosing')
    })

    it('renders a choice entry when a shortlist is offered', () => {
      const state = PanelReducer.reduce(thinking, offering())

      expect(state.entries.at(-1)).toMatchObject({ kind: 'choice', pending: true })
    })

    it('holds every candidate in the entry when a shortlist is offered', () => {
      const state = PanelReducer.reduce(thinking, offering())

      expect(state.entries.at(-1)).toMatchObject({
        candidates: ['Lists/todo.md', 'Lists/shopping.md'],
      })
    })

    it('holds the purpose in the entry, so the user reads what they are agreeing to', () => {
      const state = PanelReducer.reduce(thinking, offering())

      expect(state.entries.at(-1)).toMatchObject({ text: 'add toilet paper' })
    })
  })

  describe('when the choice is answered', () => {
    let choosing: PanelState

    beforeEach(() => {
      choosing = PanelReducer.reduce(thinking, offering())
    })

    it('names the picked note when the choice is answered', () => {
      const state = PanelReducer.reduce(choosing, {
        type: 'choiceAnswered',
        chosen: 'Lists/todo.md',
      })

      expect(state.entries.at(-1)).toEqual({
        kind: 'choice',
        candidates: ['Lists/todo.md', 'Lists/shopping.md'],
        pending: false,
        text: 'Chose Lists/todo.md',
      })
    })

    it('says the shortlist was declined when the user declines', () => {
      const state = PanelReducer.reduce(choosing, { type: 'choiceAnswered', chosen: null })

      expect(state.entries.at(-1)).toEqual({
        kind: 'choice',
        candidates: ['Lists/todo.md', 'Lists/shopping.md'],
        pending: false,
        text: 'Declined every note offered',
      })
    })

    it('returns to the thinking phase when answered, so the turn reads as still running', () => {
      const state = PanelReducer.reduce(choosing, {
        type: 'choiceAnswered',
        chosen: 'Lists/todo.md',
      })

      expect(state.phase).toBe('thinking')
    })

    it('leaves a settled choice entry alone when a second choice is answered', () => {
      const settled = PanelReducer.reduce(choosing, {
        type: 'choiceAnswered',
        chosen: 'Lists/todo.md',
      })

      const state = PanelReducer.reduce(settled, { type: 'choiceAnswered', chosen: null })

      expect(state.entries.at(-1)).toMatchObject({ text: 'Chose Lists/todo.md' })
    })
  })

  // The third outcome: neither picked nor declined. A turn that ends with a
  // live shortlist must leave no rows behind, and must not record a decline the
  // user never made.
  describe('when the turn ends with a shortlist unanswered', () => {
    let choosing: PanelState

    beforeEach(() => {
      choosing = PanelReducer.reduce(thinking, offering())
    })

    it('settles a pending choice when the turn ends, so no live list outlives its turn', () => {
      const state = PanelReducer.reduce(choosing, { type: 'summary', text: 'done' })

      expect(state.entries.at(-2)).toMatchObject({ pending: false })
    })

    it('says the turn ended rather than that the user declined, when a turn ends unanswered', () => {
      const state = PanelReducer.reduce(choosing, { type: 'summary', text: 'done' })

      expect(state.entries.at(-2)).toMatchObject({
        text: 'The turn ended before you picked a note',
      })
    })

    it('settles a pending choice when the turn is cancelled', () => {
      const state = PanelReducer.reduce(choosing, { type: 'turnCancelled', writtenNotes: [] })

      expect(state.entries.at(-2)).toMatchObject({ pending: false })
    })

    it('settles a pending choice when the turn fails', () => {
      const state = PanelReducer.reduce(choosing, {
        type: 'failed',
        step: 'edit',
        message: 'broke',
      })

      expect(state.entries.at(-2)).toMatchObject({ pending: false })
    })
  })

  describe('when a question is asked', () => {
    const asking = () =>
      PanelReducer.reduce(thinking, {
        type: 'questionAsked',
        text: 'Which shopping list?',
        suggestions: ['Lists/a.md', 'Lists/b.md'],
      })

    it('moves to the asking phase when a question is requested', () => {
      expect(asking().phase).toBe('asking')
    })

    it('renders a question entry carrying its suggestions', () => {
      expect(asking().entries.at(-1)).toEqual({
        kind: 'question',
        pending: true,
        suggestions: ['Lists/a.md', 'Lists/b.md'],
        text: 'Which shopping list?',
      })
    })

    it('returns to the thinking phase when the question is answered', () => {
      const state = PanelReducer.reduce(asking(), { type: 'questionAnswered' })

      expect(state.phase).toBe('thinking')
    })

    it('keeps the question text when it is answered', () => {
      const state = PanelReducer.reduce(asking(), { type: 'questionAnswered' })

      expect(state.entries.at(-1)).toMatchObject({ text: 'Which shopping list?' })
    })

    it('settles the question when it is answered, so its suggestions stop offering', () => {
      const state = PanelReducer.reduce(asking(), { type: 'questionAnswered' })

      expect(state.entries.at(-1)).toMatchObject({ pending: false })
    })
  })

  describe('when a turn ends with a question unanswered', () => {
    let asking: PanelState

    beforeEach(() => {
      asking = PanelReducer.reduce(thinking, {
        type: 'questionAsked',
        text: 'Which shopping list?',
        suggestions: ['Lists/a.md'],
      })
    })

    it('keeps the question text when the turn ends unanswered', () => {
      const state = PanelReducer.reduce(asking, { type: 'summary', text: 'stopped' })

      expect(state.entries.at(-2)).toMatchObject({ text: 'Which shopping list?' })
    })

    it('drops the question buttons when the turn ends unanswered', () => {
      const state = PanelReducer.reduce(asking, { type: 'summary', text: 'stopped' })

      expect(state.entries.at(-2)).toMatchObject({ pending: false })
    })

    it('drops the question buttons when the turn fails unanswered', () => {
      const state = PanelReducer.reduce(asking, {
        type: 'failed',
        step: 'chat',
        message: 'it broke',
      })

      expect(state.entries.at(-2)).toMatchObject({ pending: false })
    })

    it('drops the question buttons when the turn is cancelled unanswered', () => {
      const state = PanelReducer.reduce(asking, { type: 'turnCancelled', writtenNotes: [] })

      expect(state.entries.at(-2)).toMatchObject({ pending: false })
    })
  })

  describe('when the turn is running low on steps', () => {
    it('adds a warning entry when a warning is reported', () => {
      const state = PanelReducer.reduce(thinking, { type: 'warned', text: '3 steps left' })

      expect(state.entries.at(-1)).toEqual({ kind: 'warning', text: '3 steps left' })
    })

    it('keeps the phase when a warning is reported, since the turn is still running', () => {
      const state = PanelReducer.reduce(thinking, { type: 'warned', text: '3 steps left' })

      expect(state.phase).toBe('thinking')
    })
  })

  describe('when the turn takes steps', () => {
    const aStep = (label: string, detail: string, refused = false) =>
      ({ type: 'stepTaken', label, detail, refused }) as const

    it('adds a steps entry when the first step is taken', () => {
      const state = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))

      expect(state.entries.at(-1)).toEqual({
        kind: 'steps',
        steps: [{ label: 'Searched', detail: 'milk — 3 matches', refused: false }],
      })
    })

    it('appends to the open entry when a second step is taken', () => {
      const first = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))

      const state = PanelReducer.reduce(first, aStep('Read', 'Lists/todo.md'))

      expect(state.entries.at(-1)).toMatchObject({
        steps: [{ label: 'Searched' }, { label: 'Read' }],
      })
    })

    it('gains one entry rather than one per step, so the list stays short', () => {
      const first = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))

      const state = PanelReducer.reduce(first, aStep('Read', 'Lists/todo.md'))

      expect(state.entries.filter((entry) => entry.kind === 'steps')).toHaveLength(1)
    })

    it('keeps one entry when another entry came between the steps', () => {
      const first = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))
      const interrupted = PanelReducer.reduce(first, {
        type: 'answer',
        text: 'an answer',
        sources: [],
      })

      const state = PanelReducer.reduce(interrupted, aStep('Read', 'Lists/todo.md'))

      expect(state.entries.filter((entry) => entry.kind === 'steps')).toHaveLength(1)
    })

    it('appends to the entry that an interleaved entry displaced', () => {
      const first = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))
      const interrupted = PanelReducer.reduce(first, {
        type: 'answer',
        text: 'an answer',
        sources: [],
      })

      const state = PanelReducer.reduce(interrupted, aStep('Read', 'Lists/todo.md'))

      expect(state.entries.find((entry) => entry.kind === 'steps')).toMatchObject({
        steps: [{ label: 'Searched' }, { label: 'Read' }],
      })
    })

    it('starts a fresh entry for the next turn, so one turn is one list', () => {
      const first = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))
      const nextTurn = PanelReducer.reduce(first, { type: 'transcript', text: 'do more' })

      const state = PanelReducer.reduce(nextTurn, aStep('Read', 'Lists/todo.md'))

      expect(state.entries.filter((entry) => entry.kind === 'steps')).toHaveLength(2)
    })

    it('keeps the phase when a step is taken, since the turn is still running', () => {
      const state = PanelReducer.reduce(thinking, aStep('Searched', 'milk — 3 matches'))

      expect(state.phase).toBe('thinking')
    })

    it('carries the refused flag when a call was refused', () => {
      const state = PanelReducer.reduce(thinking, aStep('Refused', 'cap reached', true))

      expect(state.entries.at(-1)).toMatchObject({ steps: [{ refused: true }] })
    })
  })
})
