import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { OpenedNoteWait } from '../opened-note-wait'
import { FakeWorkspace } from '../../test-support/fake-workspace'

const DAILY = 'Journal/2026-09-02.md'

describe('OpenedNoteWait', () => {
  let workspace: FakeWorkspace

  beforeEach(() => {
    workspace = new FakeWorkspace('note.md')
  })

  const waitOf = () =>
    new OpenedNoteWait({ workspace: workspace.asWorkspace() } as unknown as App, 200)

  describe('when the editor mounts after the open is announced', () => {
    it('returns the path once the editor exists', async () => {
      const opened = waitOf().forOpen(() => {
        workspace.announcesOpenWithoutEditor(DAILY)
        setTimeout(() => workspace.mountsEditor(DAILY), 20)
      })

      await expect(opened).resolves.toBe(DAILY)
    })
  })

  describe('when the editor never mounts', () => {
    it('returns nothing once the wait runs out', async () => {
      const opened = waitOf().forOpen(() => workspace.announcesOpenWithoutEditor(DAILY))

      await expect(opened).resolves.toBeNull()
    })
  })

  describe('when the command opens no note', () => {
    it('returns nothing once the wait runs out', async () => {
      const opened = waitOf().forOpen(() => undefined)

      await expect(opened).resolves.toBeNull()
    })
  })
})
