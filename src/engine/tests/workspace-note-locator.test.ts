import { describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { WorkspaceNoteLocator } from '../note-binding/workspace-note-locator'
import { FakeWorkspace } from '../../test-support/fake-workspace'

const NOTE = 'Journal/todo.md'
const OTHER = 'Journal/done.md'
const BASE = 'Journal/Untitled.base'

// Obsidian opens canvases, PDFs and Bases files through the same event a note
// arrives on. A session bound to one is stuck: the edit tools need an editor,
// and only a markdown view has one.
describe('WorkspaceNoteLocator', () => {
  const locatorOn = (workspace: FakeWorkspace) =>
    new WorkspaceNoteLocator({ workspace: workspace.asWorkspace() } as unknown as App)

  const locatorOf = (openPath: string | null = null) => locatorOn(new FakeWorkspace(openPath))

  // The panel saying a note is not open is never the helpful answer, so a
  // markdown note with no leaf resolves and the write goes through the vault
  // (D5). Only a path no editor could ever show is refused.
  describe('when a markdown note has no leaf at all', () => {
    it('answers an OpenNote rather than failing', async () => {
      const outcome = await locatorOf().locate(NOTE)

      expect(outcome.succeeded()).toBe(true)
    })

    it('carries a null editor, so the write falls to the vault', async () => {
      const outcome = await locatorOf().locate(NOTE)

      expect(outcome.succeeded() && outcome.value.editor).toBeNull()
    })

    it('names the path on it, so a vault write knows where to go', async () => {
      const outcome = await locatorOf().locate(NOTE)

      expect(outcome.succeeded() && outcome.value.path).toBe(NOTE)
    })
  })

  describe('when the path is not a markdown note', () => {
    it('says it cannot be edited rather than that it is not open', async () => {
      const outcome = await locatorOf().locate(BASE)

      expect(outcome.hasFailed() && outcome.message).toContain('is not a markdown note')
    })

    it('names the reset, since no amount of opening will fix it', async () => {
      const outcome = await locatorOf().locate(BASE)

      expect(outcome.hasFailed() && outcome.message).toContain('press Reset')
    })

    // The markdown check sits above the search, so a session bound to a canvas
    // costs no loads at all.
    it('fails before loading anything', async () => {
      const workspace = new FakeWorkspace().defers(NOTE)

      await locatorOn(workspace).locate(BASE)

      expect(workspace.loadedLeaves).toEqual([])
    })
  })

  // Obsidian 1.7.2 defers a background tab's view, so the leaf holds a stand-in
  // with neither file nor editor. Reading it as a MarkdownView is what stranded
  // the reported session on its second utterance.
  describe('when the note is open in a leaf that is not deferred', () => {
    it('answers an OpenNote holding that leaf`s editor', async () => {
      const workspace = new FakeWorkspace(NOTE)

      const outcome = await locatorOn(workspace).locate(NOTE)

      expect(outcome.succeeded()).toBe(true)
    })

    it('loads nothing, so the workspace keeps its deferred tabs', async () => {
      const workspace = new FakeWorkspace(NOTE).defers(OTHER)

      await locatorOn(workspace).locate(NOTE)

      expect(workspace.loadedLeaves).toEqual([])
    })
  })

  describe('when the note is open in a leaf that is deferred', () => {
    it('loads that leaf and answers an OpenNote holding its editor', async () => {
      const workspace = new FakeWorkspace().defers(NOTE)

      const outcome = await locatorOn(workspace).locate(NOTE)

      expect(outcome.succeeded()).toBe(true)
    })

    // The load replaces the stand-in view rather than filling it in, so a match
    // made before the load reads a view that has no file at all.
    it('reads the view after the load, not the empty one before it', async () => {
      const workspace = new FakeWorkspace().defers(NOTE)

      const outcome = await locatorOn(workspace).locate(NOTE)

      expect(outcome.succeeded() && outcome.value.path).toBe(NOTE)
    })

    it('loads the leaf it matched', async () => {
      const workspace = new FakeWorkspace().defers(NOTE)

      await locatorOn(workspace).locate(NOTE)

      expect(workspace.loadedLeaves).toEqual([NOTE])
    })
  })

  describe('when several leaves are deferred and one holds the note', () => {
    it('stops loading at the first leaf that matches', async () => {
      const workspace = new FakeWorkspace().defers(NOTE).defers(OTHER)

      await locatorOn(workspace).locate(NOTE)

      expect(workspace.loadedLeaves).toEqual([NOTE])
    })

    it('leaves the deferred tabs after the match untouched', async () => {
      const workspace = new FakeWorkspace().defers(OTHER).defers(NOTE)

      await locatorOn(workspace).locate(NOTE)

      expect(workspace.loadedLeaves).toEqual([OTHER, NOTE])
    })
  })

  describe('when every leaf is deferred and none holds the note', () => {
    it('answers an OpenNote with a null editor rather than a failure', async () => {
      const workspace = new FakeWorkspace().defers(OTHER)

      const outcome = await locatorOn(workspace).locate(NOTE)

      expect(outcome.succeeded() && outcome.value.editor).toBeNull()
    })

    // A miss is only known once every deferred leaf has been looked at, so the
    // bound is the tab count rather than the first leaf.
    it('loads every deferred leaf, since a miss is only known once', async () => {
      const workspace = new FakeWorkspace().defers(OTHER).defers('Journal/other.md')

      await locatorOn(workspace).locate(NOTE)

      expect(workspace.loadedLeaves).toEqual([OTHER, 'Journal/other.md'])
    })
  })

  // The save exists because a view disagrees with its file for two seconds after
  // a write. A save that silently found nothing would put a note's own last edit
  // outside a read that follows it, and a deferred leaf is exactly that case.
  describe('when saving the open note', () => {
    it('saves the view of a leaf that is not deferred', async () => {
      const workspace = new FakeWorkspace(NOTE)

      await locatorOn(workspace).saveOpenNote(NOTE)

      expect(workspace.savesOf(NOTE)).toBe(1)
    })

    it('loads the leaf and saves the view it loaded', async () => {
      const workspace = new FakeWorkspace().defers(NOTE)

      await locatorOn(workspace).saveOpenNote(NOTE)

      expect(workspace.savesOf(NOTE)).toBe(1)
    })

    it('saves nothing and does not throw when the note has no leaf', async () => {
      const workspace = new FakeWorkspace()

      await expect(locatorOn(workspace).saveOpenNote(NOTE)).resolves.toBeUndefined()
    })
  })
})
