import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_PANEL_STATE, PanelState } from '../models/panel-state'
import { PanelReducer } from '../models/panel-reducer'
import { PanelAction } from '../models/panel-action'

const TARGET = 'Lists/todo.md'

// The action the engine's choice sends, so a test states which notes were
// offered rather than repeating the shape at each case.
const offering = (
  candidates = ['Lists/todo.md', 'Lists/shopping.md'],
  purpose = 'add toilet paper',
): PanelAction => ({ type: 'choiceRequested', candidates, purpose })

const aProgressLine = (
  label: string,
  detail: string,
  refused = false,
  note: string | null = null,
) => ({ type: 'progressLine', label, detail, refused, note }) as const

describe('PanelReducer', () => {
  let thinking: PanelState

  beforeEach(() => {
    thinking = PanelReducer.reduce(INITIAL_PANEL_STATE, {
      type: 'transcript',
      text: 'do it',
      target: TARGET,
    })
  })

  describe('when a cancel is requested', () => {
    it('moves to the cancelling phase', () => {
      const state = PanelReducer.reduce(thinking, { type: 'cancelRequested' })

      expect(state.phase).toBe('cancelling')
    })

    it('leaves the entries alone until the turn stops', () => {
      const state = PanelReducer.reduce(thinking, { type: 'cancelRequested' })

      expect(state.flattened()).toEqual(thinking.flattened())
    })
  })

  describe('when the cancellation lands', () => {
    let cancelling: PanelState

    beforeEach(() => {
      cancelling = PanelReducer.reduce(thinking, { type: 'cancelRequested' })
    })

    it('returns to idle', () => {
      const state = PanelReducer.reduce(cancelling, { type: 'turnCancelled', notesWritten: [] })

      expect(state.phase).toBe('idle')
    })

    it('appends an entry saying nothing changed when no note was written', () => {
      const state = PanelReducer.reduce(cancelling, { type: 'turnCancelled', notesWritten: [] })

      expect(state.flattened().at(-1)).toEqual({
        kind: 'cancelled',
        text: 'Stopped. Nothing was changed.',
      })
    })

    it('appends an entry naming the note when one was written', () => {
      const state = PanelReducer.reduce(cancelling, {
        type: 'turnCancelled',
        notesWritten: ['note.md'],
      })

      expect(state.flattened().at(-1)).toEqual({
        kind: 'cancelled',
        text: 'Stopped. Already changed: note.md',
      })
    })

    it('names every note when the turn wrote to more than one', () => {
      const state = PanelReducer.reduce(cancelling, {
        type: 'turnCancelled',
        notesWritten: ['note.md', 'Journal/day.md'],
      })

      expect(state.flattened().at(-1)).toEqual({
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

      expect(state.flattened().at(-1)).toMatchObject({ kind: 'choice', pending: true })
    })

    it('holds every candidate in the entry when a shortlist is offered', () => {
      const state = PanelReducer.reduce(thinking, offering())

      expect(state.flattened().at(-1)).toMatchObject({
        candidates: ['Lists/todo.md', 'Lists/shopping.md'],
      })
    })

    it('holds the purpose in the entry, so the user reads what they are agreeing to', () => {
      const state = PanelReducer.reduce(thinking, offering())

      expect(state.flattened().at(-1)).toMatchObject({ text: 'add toilet paper' })
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

      expect(state.flattened().at(-1)).toEqual({
        kind: 'choice',
        candidates: ['Lists/todo.md', 'Lists/shopping.md'],
        pending: false,
        text: 'Chose Lists/todo.md',
      })
    })

    it('says the shortlist was declined when the user declines', () => {
      const state = PanelReducer.reduce(choosing, { type: 'choiceAnswered', chosen: null })

      expect(state.flattened().at(-1)).toEqual({
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

      expect(state.flattened().at(-1)).toMatchObject({ text: 'Chose Lists/todo.md' })
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

      expect(state.flattened().at(-2)).toMatchObject({ pending: false })
    })

    it('says the turn ended rather than that the user declined, when a turn ends unanswered', () => {
      const state = PanelReducer.reduce(choosing, { type: 'summary', text: 'done' })

      expect(state.flattened().at(-2)).toMatchObject({
        text: 'The turn ended before you picked a note',
      })
    })

    it('settles a pending choice when the turn is cancelled', () => {
      const state = PanelReducer.reduce(choosing, { type: 'turnCancelled', notesWritten: [] })

      expect(state.flattened().at(-2)).toMatchObject({ pending: false })
    })

    it('settles a pending choice when the turn fails', () => {
      const state = PanelReducer.reduce(choosing, {
        type: 'failed',
        step: 'apply',
        message: 'broke',
      })

      expect(state.flattened().at(-2)).toMatchObject({ pending: false })
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
      expect(asking().flattened().at(-1)).toEqual({
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

      expect(state.flattened().at(-1)).toMatchObject({ text: 'Which shopping list?' })
    })

    it('settles the question when it is answered, so its suggestions stop offering', () => {
      const state = PanelReducer.reduce(asking(), { type: 'questionAnswered' })

      expect(state.flattened().at(-1)).toMatchObject({ pending: false })
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

      expect(state.flattened().at(-2)).toMatchObject({ text: 'Which shopping list?' })
    })

    it('drops the question buttons when the turn ends unanswered', () => {
      const state = PanelReducer.reduce(asking, { type: 'summary', text: 'stopped' })

      expect(state.flattened().at(-2)).toMatchObject({ pending: false })
    })

    it('drops the question buttons when the turn fails unanswered', () => {
      const state = PanelReducer.reduce(asking, {
        type: 'failed',
        step: 'chat',
        message: 'it broke',
      })

      expect(state.flattened().at(-2)).toMatchObject({ pending: false })
    })

    it('drops the question buttons when the turn is cancelled unanswered', () => {
      const state = PanelReducer.reduce(asking, { type: 'turnCancelled', notesWritten: [] })

      expect(state.flattened().at(-2)).toMatchObject({ pending: false })
    })
  })

  describe('when the turn is running low on steps', () => {
    it('adds a warning entry when a warning is reported', () => {
      const state = PanelReducer.reduce(thinking, { type: 'warned', text: '3 steps left' })

      expect(state.flattened().at(-1)).toEqual({ kind: 'warning', text: '3 steps left' })
    })

    it('keeps the phase when a warning is reported, since the turn is still running', () => {
      const state = PanelReducer.reduce(thinking, { type: 'warned', text: '3 steps left' })

      expect(state.phase).toBe('thinking')
    })
  })

  describe('when the turn publishes progress lines', () => {
    it('adds a progress entry when the first line is published', () => {
      const state = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))

      expect(state.flattened().at(-1)).toEqual({
        kind: 'progress',
        lines: [{ label: 'Searched', detail: 'milk — 3 matches', refused: false, note: null }],
      })
    })

    // Stored rather than compared here: the comparison against the turn's
    // target is the view's, so a restored session shows what it showed.
    it('keeps the note a line acted on', () => {
      const state = PanelReducer.reduce(thinking, aProgressLine('Read', '', false, 'Lists/todo.md'))

      expect(state.flattened().at(-1)).toEqual({
        kind: 'progress',
        lines: [{ label: 'Read', detail: '', refused: false, note: 'Lists/todo.md' }],
      })
    })

    it('appends to the open entry when a second line is published', () => {
      const first = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))

      const state = PanelReducer.reduce(first, aProgressLine('Read', 'Lists/todo.md'))

      expect(state.flattened().at(-1)).toMatchObject({
        lines: [{ label: 'Searched' }, { label: 'Read' }],
      })
    })

    it('gains one entry rather than one per step, so the list stays short', () => {
      const first = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))

      const state = PanelReducer.reduce(first, aProgressLine('Read', 'Lists/todo.md'))

      expect(state.flattened().filter((entry) => entry.kind === 'progress')).toHaveLength(1)
    })

    it('keeps one entry when another entry came between the steps', () => {
      const first = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))
      const interrupted = PanelReducer.reduce(first, {
        type: 'answer',
        text: 'an answer',
        sources: [],
      })

      const state = PanelReducer.reduce(interrupted, aProgressLine('Read', 'Lists/todo.md'))

      expect(state.flattened().filter((entry) => entry.kind === 'progress')).toHaveLength(1)
    })

    it('appends to the entry that an interleaved entry displaced', () => {
      const first = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))
      const interrupted = PanelReducer.reduce(first, {
        type: 'answer',
        text: 'an answer',
        sources: [],
      })

      const state = PanelReducer.reduce(interrupted, aProgressLine('Read', 'Lists/todo.md'))

      expect(state.flattened().find((entry) => entry.kind === 'progress')).toMatchObject({
        lines: [{ label: 'Searched' }, { label: 'Read' }],
      })
    })

    it('starts a fresh entry for the next turn, so one turn is one list', () => {
      const first = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))
      const nextTurn = PanelReducer.reduce(first, {
        type: 'transcript',
        text: 'do more',
        target: TARGET,
      })

      const state = PanelReducer.reduce(nextTurn, aProgressLine('Read', 'Lists/todo.md'))

      expect(state.flattened().filter((entry) => entry.kind === 'progress')).toHaveLength(2)
    })

    it('keeps the phase when a step is taken, since the turn is still running', () => {
      const state = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk — 3 matches'))

      expect(state.phase).toBe('thinking')
    })

    it('carries the refused flag when a call was refused', () => {
      const state = PanelReducer.reduce(thinking, aProgressLine('Refused', 'cap reached', true))

      expect(state.flattened().at(-1)).toMatchObject({ lines: [{ refused: true }] })
    })
  })

  // Only a tool's move reaches the reducer. The user's own is dropped before
  // the dispatch, since the turn's target says what the removed entry used to.
  describe('when a tool moves the turn to another note', () => {
    it('names the new note on the open turn', () => {
      const state = PanelReducer.reduce(thinking, {
        type: 'targetMoved',
        path: 'Lists/shopping.md',
      })

      expect(state.entries.at(-1)).toMatchObject({
        kind: 'turn',
        target: 'Lists/shopping.md',
      })
    })

    it('leaves the open turn holding only what it produced', () => {
      const state = PanelReducer.reduce(thinking, {
        type: 'targetMoved',
        path: 'Lists/shopping.md',
      })

      expect(state.entries.at(-1)).toMatchObject({
        kind: 'turn',
        entries: [{ kind: 'user', text: 'do it' }],
      })
    })
  })

  describe('when a transcription fails with the audio still held', () => {
    const failed = (retryable?: boolean): PanelState =>
      PanelReducer.reduce(INITIAL_PANEL_STATE, {
        type: 'failed',
        step: 'transcription',
        message: 'it broke',
        retryable,
      })

    it('marks the error retryable when the panel is holding audio', () => {
      expect(failed(true).entries.at(-1)).toEqual({
        kind: 'error',
        step: 'transcription',
        text: 'it broke',
        retryable: true,
      })
    })

    it('leaves the error alone when nothing is held', () => {
      expect(failed().flattened().at(-1)).toEqual({
        kind: 'error',
        step: 'transcription',
        text: 'it broke',
        retryable: undefined,
      })
    })

    it('clears the flag on an earlier error when a new recording starts', () => {
      const state = PanelReducer.reduce(failed(true), { type: 'recordingStarted' })

      expect(state.flattened().at(-1)).toMatchObject({ retryable: false })
    })

    it('moves to the recording phase when a new recording starts', () => {
      const state = PanelReducer.reduce(failed(true), { type: 'recordingStarted' })

      expect(state.phase).toBe('recording')
    })

    it('clears the flag when a transcript comes back, since the audio is released', () => {
      const state = PanelReducer.reduce(failed(true), {
        type: 'transcript',
        text: 'do it',
        target: TARGET,
      })

      expect(state.flattened().at(-2)).toMatchObject({ retryable: false })
    })
  })

  // D6: a turn holds its own entries, so nothing scans back to a user entry to
  // work out what belongs where.
  describe('when a turn opens', () => {
    it('holds the utterance that opened it', () => {
      expect(thinking.entries).toEqual([
        { kind: 'turn', target: TARGET, entries: [{ kind: 'user', text: 'do it' }] },
      ])
    })

    it('takes the session note as its target, which is what an utterance naming none lands on', () => {
      const state = PanelReducer.reduce(INITIAL_PANEL_STATE, {
        type: 'transcript',
        text: 'add bananas',
        target: 'Lists/shopping.md',
      })

      expect(state.entries.at(-1)).toMatchObject({ target: 'Lists/shopping.md' })
    })

    it('carries no target when the session is on no note', () => {
      const state = PanelReducer.reduce(INITIAL_PANEL_STATE, {
        type: 'transcript',
        text: 'what did I write',
        target: null,
      })

      expect(state.entries.at(-1)).toMatchObject({ target: null })
    })
  })

  describe('when a turn publishes a progress line', () => {
    it('joins the open turn rather than sitting beside it', () => {
      const state = PanelReducer.reduce(thinking, aProgressLine('Searched', 'milk'))

      expect(state.entries).toHaveLength(1)
      expect(state.entries.at(-1)).toMatchObject({
        kind: 'turn',
        entries: [
          { kind: 'user', text: 'do it' },
          { kind: 'progress', lines: [{ label: 'Searched' }] },
        ],
      })
    })
  })

  // The defect archived spec 33 fixed by offsetting counters: a step after a
  // restore joined the turn above the restore marker. A container fixes it by
  // construction, since the step joins the turn that is open.
  describe('when a restored session publishes a progress line', () => {
    const restored = (): PanelState =>
      new PanelState('idle', [
        { kind: 'turn', target: TARGET, entries: [{ kind: 'user', text: 'an older turn' }] },
        { kind: 'restored', text: 'Session restored from 2026-09-11 14:32 AEST.' },
      ])

    it('joins the line to the new turn rather than the one above the restore marker', () => {
      const spoke = PanelReducer.reduce(restored(), {
        type: 'transcript',
        text: 'do it now',
        target: TARGET,
      })

      const state = PanelReducer.reduce(spoke, aProgressLine('Searched', 'milk'))

      expect(state.entries.at(-1)).toMatchObject({
        entries: [
          { kind: 'user', text: 'do it now' },
          { kind: 'progress', lines: [{ label: 'Searched' }] },
        ],
      })
    })

    it('leaves the restored turn holding what it held', () => {
      const spoke = PanelReducer.reduce(restored(), {
        type: 'transcript',
        text: 'do it now',
        target: TARGET,
      })

      const state = PanelReducer.reduce(spoke, aProgressLine('Searched', 'milk'))

      expect(state.entries.at(0)).toMatchObject({
        entries: [{ kind: 'user', text: 'an older turn' }],
      })
    })
  })
})
