import { describe, expect, it } from 'vitest'
import { SessionController } from '../session-controller'
import { SessionLeaf } from '../session-leaf'
import { PluginScope } from '../plugin-scope'
import { SessionFileStore } from '../../session/session-file-store'
import { SessionView } from '../../session/views/obsidian/session-view'
import { DEFAULT_SETTINGS } from '../../settings/settings'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeSessionWorkspace } from '../../test-support/fake-session-workspace'

const controllerOver = (workspace: FakeSessionWorkspace, adapter: FakeAdapter): SessionController =>
  new SessionController(
    new PluginScope(workspace.asApp(), () => DEFAULT_SETTINGS),
    new SessionLeaf(workspace.asApp()),
    new SessionFileStore(adapter.asAdapter(), 'plugins/tyto'),
    // Never fired by a controller built in a test, which reads the props rather
    // than the events.
    () => {},
    () => () => {},
    '1.0.0',
  )

describe('SessionController', () => {
  describe('when nothing was left behind', () => {
    it('restores no props, so the view opens empty', async () => {
      const controller = controllerOver(new FakeSessionWorkspace(), new FakeAdapter())

      const props = await controller.readPanelPropsFromSessionStore(new SessionView({} as never))

      expect(props).toBeNull()
    })
  })

  describe('when the sidebar has no leaf to give', () => {
    it('binds nothing, since there is no view to bind to', async () => {
      const workspace = new FakeSessionWorkspace().withoutRightLeaf()

      await controllerOver(workspace, new FakeAdapter()).openSession()

      expect(workspace.revealed).toEqual([])
    })
  })

  describe('when a session is already running in the leaf', () => {
    it('leaves it alone, since it follows the user from where it is', async () => {
      const view = new SessionView({} as never)
      view.bindSession({ noteName: 'day' } as never)
      const workspace = new FakeSessionWorkspace().withSessionLeaf(view)

      await controllerOver(workspace, new FakeAdapter()).openSession()

      expect(view.boundNoteName()).toBe('day')
    })
  })
})
