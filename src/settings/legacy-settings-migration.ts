import { Vault } from 'obsidian'
import { DEFAULT_SETTINGS, TytoSettings } from './settings'

// The plugin id changed from obsidian-owl to tyto, and Obsidian keys its
// stored data off the plugin folder, so the new id starts with nothing.
const LEGACY_PLUGIN_ID = 'obsidian-owl'

type StoredSettings = Partial<TytoSettings> | null

// Runs once at load, before the settings are read. Silent throughout: the
// common path is a fresh install where no legacy file exists, and a vault that
// has never held the old plugin must not learn that it once could have.
export class LegacySettingsMigration {
  // The vault rather than its adapter, because the configuration folder is
  // renameable and only the vault knows what the user called it.
  constructor(
    private readonly vault: Vault,
    private readonly loadDataFn: () => Promise<unknown>,
    private readonly saveDataFn: (settings: TytoSettings) => Promise<void>,
  ) {}

  // Data under the new id wins outright. A user who has configured the renamed
  // plugin is never overwritten by whatever the old folder still holds.
  async migrateSettings(): Promise<TytoSettings> {
    const stored = (await this.loadDataFn()) as StoredSettings
    if (stored) return LegacySettingsMigration.settingsFrom(stored)
    return await this.adoptLegacySettings()
  }

  private async adoptLegacySettings(): Promise<TytoSettings> {
    const legacy = await this.readLegacySettings()
    if (!legacy) return DEFAULT_SETTINGS
    const settings = LegacySettingsMigration.settingsFrom(legacy)
    await this.saveDataFn(settings)
    return settings
  }

  // The legacy file is left where it is. Deleting a user's only copy of an API
  // key on a guess is worse than leaving a stale file behind.
  private async readLegacySettings(): Promise<StoredSettings> {
    try {
      return JSON.parse(await this.vault.adapter.read(this.legacyDataPath())) as StoredSettings
    } catch {
      return null
    }
  }

  private legacyDataPath(): string {
    return `${this.vault.configDir}/plugins/${LEGACY_PLUGIN_ID}/data.json`
  }

  private static settingsFrom(stored: Partial<TytoSettings>): TytoSettings {
    return { ...DEFAULT_SETTINGS, ...stored }
  }
}
