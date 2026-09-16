import { describe, expect, it } from 'vitest'
import { SettingsPanelBuilder } from '../settings-panel-builder'
import { DEFAULT_SETTINGS, TytoSettings } from '../../settings/settings'
import { AllowedObsidianCommand } from '../../commands/models/allowed-obsidian-command'
import { ObsidianCommandMatch } from '../../commands/models/obsidian-command-match'
import { FakeCommandRegistry } from '../../test-support/fake-command-registry'

const builderOver = (
  registry: FakeCommandRegistry,
  readSettings: () => TytoSettings,
): SettingsPanelBuilder => new SettingsPanelBuilder(registry.asApp(), readSettings)

const settingsAllowing = (...commandAllowList: string[]): TytoSettings => ({
  ...DEFAULT_SETTINGS,
  commandAllowList,
})

describe('SettingsPanelBuilder', () => {
  describe('when the allow-list covers a registered command', () => {
    it('resolves the command the entries name', () => {
      const registry = new FakeCommandRegistry().withCommand('daily-notes:open', 'Open today')

      const props = builderOver(registry, () => settingsAllowing('daily-notes:open')).build()

      expect(props.resolvedCommands).toEqual([
        new AllowedObsidianCommand('daily-notes:open', 'Open today'),
      ])
    })

    it('hands the panel a search that reads the same allow-list', () => {
      const registry = new FakeCommandRegistry().withCommand('daily-notes:open', 'Open today')

      const props = builderOver(registry, () => settingsAllowing('daily-notes:open')).build()

      expect(props.search.matching('Open today').matches).toEqual([
        new ObsidianCommandMatch(
          new AllowedObsidianCommand('daily-notes:open', 'Open today'),
          'daily-notes:open',
        ),
      ])
    })
  })

  describe('when the allow-list covers nothing', () => {
    it('resolves no command, so the panel lists none', () => {
      const registry = new FakeCommandRegistry().withCommand('daily-notes:open', 'Open today')

      const props = builderOver(registry, () => settingsAllowing()).build()

      expect(props.resolvedCommands).toEqual([])
    })
  })

  describe('when the settings change between renders', () => {
    it('reads the settings again, so an edit reaches the next render', () => {
      const registry = new FakeCommandRegistry().withCommand('daily-notes:open', 'Open today')
      let settings = settingsAllowing()
      const builder = builderOver(registry, () => settings)
      builder.build()

      settings = settingsAllowing('daily-notes:open')

      expect(builder.build().resolvedCommands).toEqual([
        new AllowedObsidianCommand('daily-notes:open', 'Open today'),
      ])
    })
  })
})
