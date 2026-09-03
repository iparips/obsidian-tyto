import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_PANEL_STATE, PanelReducer, PanelState } from '../models/panel-state'

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
})
