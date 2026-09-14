import { beforeEach, describe, expect, it } from 'vitest'
import { FakeAdapter } from '../../test-support/fake-adapter'
import { SESSION_SNAPSHOT_VERSION, SessionSnapshot } from '../models/session-snapshot'
import { SessionStore } from '../session-store'

const PLUGIN_FOLDER = '.obsidian/plugins/tyto'
const SESSION_PATH = `${PLUGIN_FOLDER}/session.json`

const aSnapshot = (version = SESSION_SNAPSHOT_VERSION): SessionSnapshot => ({
  version,
  targetPath: 'Journal/day.md',
  messages: [],
  entries: [{ kind: 'user', text: 'add a heading' }],
})

describe('SessionStore', () => {
  let adapter: FakeAdapter
  let store: SessionStore

  beforeEach(() => {
    adapter = new FakeAdapter()
    store = new SessionStore(adapter.asAdapter(), PLUGIN_FOLDER)
  })

  describe('when a turn ends', () => {
    it('writes the record to the plugin folder when a turn ends', async () => {
      await store.write(aSnapshot())

      expect(adapter.contentsOf(SESSION_PATH)).toBe(JSON.stringify(aSnapshot()))
    })

    it('reads back what it wrote when the record is read again', async () => {
      await store.write(aSnapshot())

      expect(await store.read()).toEqual(aSnapshot())
    })
  })

  describe('when the plugin folder is unknown', () => {
    beforeEach(() => {
      store = new SessionStore(adapter.asAdapter(), undefined)
    })

    it('reads nothing when the manifest names no folder', async () => {
      expect(await store.read()).toBeNull()
    })

    it('writes nothing when the manifest names no folder', async () => {
      await store.write(aSnapshot())

      expect(adapter.contentsOf(SESSION_PATH)).toBeUndefined()
    })
  })

  describe('when no session can be read', () => {
    it('reads nothing when no session has been written', async () => {
      expect(await store.read()).toBeNull()
    })

    it('reads nothing when the stored file is not valid JSON', async () => {
      adapter.withFile(SESSION_PATH, '{ half a record')

      expect(await store.read()).toBeNull()
    })
  })

  describe('when the stored version is not the current one', () => {
    beforeEach(() => {
      adapter.withFile(SESSION_PATH, JSON.stringify(aSnapshot(2)))
    })

    it('reads nothing when the version is not the current one', async () => {
      expect(await store.read()).toBeNull()
    })

    it('deletes the stored file when the version is not the current one', async () => {
      await store.read()

      expect(adapter.contentsOf(SESSION_PATH)).toBeUndefined()
    })
  })

  describe('when the user resets', () => {
    it('deletes the stored session when the user resets', async () => {
      await store.write(aSnapshot())

      await store.discard()

      expect(adapter.contentsOf(SESSION_PATH)).toBeUndefined()
    })

    it('discards silently when no session was stored', async () => {
      await expect(store.discard()).resolves.toBeUndefined()
    })
  })

  describe('when a write fails', () => {
    beforeEach(() => {
      adapter.withFailingWrites()
    })

    it('reports nothing to the caller when a write fails', async () => {
      await expect(store.write(aSnapshot())).resolves.toBeUndefined()
    })

    it('leaves the stored session untouched when a write fails', async () => {
      adapter.withFile(SESSION_PATH, JSON.stringify(aSnapshot()))

      await store.write({ ...aSnapshot(), targetPath: 'other.md' })

      expect(await store.read()).toEqual(aSnapshot())
    })
  })
})
