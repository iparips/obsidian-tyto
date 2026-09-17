import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vault } from 'obsidian'
import { LegacySettingsMigration } from '../legacy-settings-migration'
import { DEFAULT_SETTINGS, TytoSettings } from '../settings'
import { FakeAdapter } from '../../test-support/fake-adapter'

// Renamed from the default, so a hardcoded .obsidian would read nothing here.
const CONFIG_DIR = '.my-config'
const LEGACY_PATH = `${CONFIG_DIR}/plugins/obsidian-owl/data.json`

describe('LegacySettingsMigration', () => {
  let adapter: FakeAdapter
  let stored: Partial<TytoSettings> | null
  let saved: TytoSettings[]
  let migration: LegacySettingsMigration

  beforeEach(() => {
    adapter = new FakeAdapter()
    stored = null
    saved = []
    const vault = { configDir: CONFIG_DIR, adapter: adapter.asAdapter() } as Vault
    migration = new LegacySettingsMigration(
      vault,
      () => Promise.resolve(stored),
      (settings) => {
        saved.push(settings)
        return Promise.resolve()
      },
    )
  })

  describe('when the new id already holds settings', () => {
    beforeEach(() => {
      stored = { mistralApiKey: 'new-key' }
      adapter.withFile(LEGACY_PATH, JSON.stringify({ mistralApiKey: 'legacy-key' }))
    })

    it('keeps the stored key when a legacy file also exists', async () => {
      const settings = await migration.migrateSettings()

      expect(settings.mistralApiKey).toBe('new-key')
    })

    it('writes nothing when the stored settings already win', async () => {
      await migration.migrateSettings()

      expect(saved).toEqual([])
    })
  })

  describe('when only the legacy id holds settings', () => {
    beforeEach(() => {
      adapter.withFile(
        LEGACY_PATH,
        JSON.stringify({ mistralApiKey: 'legacy-key', commandAllowList: ['daily-notes'] }),
      )
    })

    it('returns the legacy settings over the defaults', async () => {
      const settings = await migration.migrateSettings()

      expect(settings).toEqual({
        ...DEFAULT_SETTINGS,
        mistralApiKey: 'legacy-key',
        commandAllowList: ['daily-notes'],
      })
    })

    it('saves them under the new id so the migration runs once', async () => {
      const settings = await migration.migrateSettings()

      expect(saved).toEqual([settings])
    })
  })

  describe('when neither id holds settings', () => {
    it('returns the defaults on a fresh install', async () => {
      const settings = await migration.migrateSettings()

      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('saves nothing, so a fresh vault is untouched', async () => {
      await migration.migrateSettings()

      expect(saved).toEqual([])
    })
  })

  describe('when the legacy file cannot be parsed', () => {
    it('returns the defaults rather than failing the load', async () => {
      adapter.withFile(LEGACY_PATH, 'not json')

      expect(await migration.migrateSettings()).toEqual(DEFAULT_SETTINGS)
    })

    it('prints nothing, since a fresh install takes the same path', async () => {
      const console_ = vi.spyOn(console, 'debug').mockImplementation(() => {})
      adapter.withFile(LEGACY_PATH, 'not json')

      await migration.migrateSettings()

      expect(console_).not.toHaveBeenCalled()
    })
  })
})
