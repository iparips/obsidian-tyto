import { beforeEach, describe, expect, it } from 'vitest'
import { App } from 'obsidian'
import { CommandRunner } from '../command-runner'
import { CommandCatalogue } from '../command-catalogue'
import { AllowList } from '../allow-list'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'
import { FakeWorkspace } from '../../test-support/fake-workspace'
import { OpenedNoteWait } from '../opened-note-wait'

describe('CommandRunner', () => {
  let registry: FakeCommandRegistry
  let workspace: FakeWorkspace

  beforeEach(() => {
    registry = new FakeCommandRegistry().withCommand('daily-notes:goto-today', 'Open today')
    workspace = new FakeWorkspace('note.md')
  })

  const appOf = (): App =>
    ({ ...registry.asApp(), workspace: workspace.asWorkspace() }) as unknown as App

  const runnerOf = (...entries: string[]) => {
    const app = appOf()
    return new CommandRunner(
      app,
      new CommandCatalogue(app, new AllowList(entries)),
      new OpenedNoteWait(app, 30),
    )
  }

  describe('when the id is outside the catalogue', () => {
    it('returns a refusal naming the id when the id is not allowed', async () => {
      const outcome = await runnerOf('daily-notes:*').run('file-explorer:delete-file')

      expect(outcome).toMatchObject({
        message: 'file-explorer:delete-file is not an allowed command in this vault',
      })
    })

    it('never calls the registry when the id is not allowed', async () => {
      await runnerOf('daily-notes:*').run('file-explorer:delete-file')

      expect(registry.executed).toEqual([])
    })
  })

  describe('when the command opens a note', () => {
    beforeEach(() => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        workspace.finishesOpening('Journal/2026-09-02.md')
        return true
      }
    })

    it('reports the opened path when the active note changes', async () => {
      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome).toMatchObject({ value: { openedPath: 'Journal/2026-09-02.md' } })
    })

    it('rebinds when the active note changes', async () => {
      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome.hasFailed() ? null : outcome.value.rebinds()).toBe(true)
    })

    it('names the new note in the tool result when the active note changes', async () => {
      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome.hasFailed() ? '' : outcome.value.describe()).toBe(
        'ran Open today; the session is now editing Journal/2026-09-02.md',
      )
    })
  })

  describe('when the command opens no note', () => {
    it('does not rebind when the active note is unchanged', async () => {
      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome.hasFailed() ? null : outcome.value.rebinds()).toBe(false)
    })

    it('says the binding stayed when the active note is unchanged', async () => {
      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome.hasFailed() ? '' : outcome.value.describe()).toBe(
        'ran Open today; no note opened, still editing the same note',
      )
    })

    it('does not rebind when no note is active after the run', async () => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        workspace.opens(null)
        return true
      }

      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome.hasFailed() ? null : outcome.value.rebinds()).toBe(false)
    })
  })

  describe('when the note opens after the command returns', () => {
    it('reports the opened path when the open lands late', async () => {
      registry.executeCommandById = (id: string) => {
        registry.executed.push(id)
        setTimeout(() => workspace.finishesOpening('Journal/2026-09-02.md'), 20)
        return true
      }

      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome).toMatchObject({ value: { openedPath: 'Journal/2026-09-02.md' } })
    })

    it('opens nothing when no note ever opens', async () => {
      const outcome = await runnerOf('daily-notes:*').run('daily-notes:goto-today')

      expect(outcome.hasFailed() ? null : outcome.value.rebinds()).toBe(false)
    })
  })
})
