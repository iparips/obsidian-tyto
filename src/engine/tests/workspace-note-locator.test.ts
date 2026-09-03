import { describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { WorkspaceNoteLocator } from '../workspace-note-locator'
import { FakeWorkspace } from '../../test-support/fake-workspace'

const NOTE = 'Journal/todo.md'
const BASE = 'Journal/Untitled.base'

// Obsidian opens canvases, PDFs and Bases files through the same event a note
// arrives on. A session bound to one is stuck: the edit tools need an editor,
// and only a markdown view has one.
describe('WorkspaceNoteLocator', () => {
  const locatorOf = (openPath: string | null = null) =>
    new WorkspaceNoteLocator({
      workspace: new FakeWorkspace(openPath).asWorkspace(),
    } as unknown as App)

  describe('when a markdown note is not open', () => {
    it('says the note is not open, since opening it is the fix', () => {
      const outcome = locatorOf().locate(NOTE)

      expect(outcome.hasFailed() && outcome.message).toBe(`${NOTE} is not open in an editor`)
    })
  })

  describe('when the path is not a markdown note', () => {
    it('says it cannot be edited rather than that it is not open', () => {
      const outcome = locatorOf().locate(BASE)

      expect(outcome.hasFailed() && outcome.message).toContain('is not a markdown note')
    })

    it('names the reset, since no amount of opening will fix it', () => {
      const outcome = locatorOf().locate(BASE)

      expect(outcome.hasFailed() && outcome.message).toContain('press Reset')
    })
  })
})
