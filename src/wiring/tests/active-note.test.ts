import { describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { ActiveNote } from '../active-note'
import { FakeWorkspace } from '../../test-support/fake-workspace'

const activeNoteWith = (path: string | null): ActiveNote =>
  new ActiveNote({ workspace: new FakeWorkspace(path).asWorkspace() } as App)

describe('ActiveNote', () => {
  describe('when a markdown note is open', () => {
    it('names the path the session binds to', () => {
      expect(activeNoteWith('Journal/day.md').path()).toBe('Journal/day.md')
    })
  })

  describe('when the open file is not a note', () => {
    it('names nothing, since no editor can show a canvas an edit tool needs', () => {
      expect(activeNoteWith('Boards/plan.canvas').path()).toBeNull()
    })
  })

  describe('when nothing is open', () => {
    it('names nothing, which is an unbound session', () => {
      expect(activeNoteWith(null).path()).toBeNull()
    })
  })
})
