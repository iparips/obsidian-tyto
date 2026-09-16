import { describe, expect, it } from 'vitest'
import { App, TFile } from 'obsidian'
import { SessionController } from '../session-controller'
import { SessionLeaf } from '../session-leaf'
import { PluginScope } from '../plugin-scope'
import { SessionFileStore } from '../../session/session-file-store'
import { SessionView } from '../../session/views/obsidian/session-view'
import { SESSION_SNAPSHOT_VERSION } from '../../session/models/session-snapshot'
import { DEFAULT_SETTINGS } from '../../settings/settings'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { FakeSessionWorkspace } from '../../test-support/fake-session-workspace'

const PLUGIN_FOLDER = 'plugins/tyto'
const BOUND_NOTE = 'Journal/day.md'

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

// A file as the file-open event carries it. Only the extension and the path are
// read on the way to the engine.
const anOpenedFile = (path: string, extension: string): TFile => ({ path, extension }) as TFile

// A session already bound to a note, and the file-open listener that moves it.
// Restoring is what hands a test the props publicly, and it registers the
// follow the same way opening a fresh session does.
const aBoundSession = async (): Promise<{
  retargets: (string | null)[]
  openFile: (file: TFile | null) => void
}> => {
  const adapter = new FakeAdapter({
    [`${PLUGIN_FOLDER}/session.json`]: JSON.stringify({
      version: SESSION_SNAPSHOT_VERSION,
      targetPath: BOUND_NOTE,
      messages: [],
      entries: [],
    }),
  })
  const workspace = new FakeSessionWorkspace()
  const app = { workspace, vault: { adapter: adapter.asAdapter() } } as unknown as App
  let openFileFn: (file: TFile | null) => void = () => {}
  const controller = new SessionController(
    new PluginScope(app, () => DEFAULT_SETTINGS),
    new SessionLeaf(app),
    new SessionFileStore(adapter.asAdapter(), PLUGIN_FOLDER),
    (listenerFn) => (openFileFn = listenerFn),
    () => () => {},
    '1.0.0',
  )

  const props = await controller.readPanelPropsFromSessionStore(new SessionView({} as never))
  const retargets: (string | null)[] = []
  props?.onTargetNoteChanged?.((report) => retargets.push(report.path))
  // The channel the header reads is what these scenarios assert on, so a props
  // object without it would leave every one of them passing on an empty list.
  expect(props?.onTargetNoteChanged).toBeDefined()
  // The workspace holds nothing open, so a restored session starts unbound.
  // Opening the note is what binds it, and what every scenario below starts from.
  openFileFn(anOpenedFile(BOUND_NOTE, 'md'))
  retargets.length = 0
  return { retargets, openFile: openFileFn }
}

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

  describe('when the active tab changes', () => {
    it('unbinds the session when the tab holds no file', async () => {
      const { retargets, openFile } = await aBoundSession()

      openFile(null)

      expect(retargets).toEqual([null])
    })

    it('unbinds the session when the tab holds no markdown note', async () => {
      const { retargets, openFile } = await aBoundSession()

      openFile(anOpenedFile('Boards/plan.canvas', 'canvas'))

      expect(retargets).toEqual([null])
    })

    it('binds the session to the note when the tab holds one', async () => {
      const { retargets, openFile } = await aBoundSession()

      openFile(anOpenedFile('Journal/week.md', 'md'))

      expect(retargets).toEqual(['Journal/week.md'])
    })
  })
})
