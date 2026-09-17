import { beforeEach, describe, expect, it } from 'vitest'
import { App, SettingDefinition, SettingDefinitionGroup, SettingDefinitionItem } from 'obsidian'
import { SettingsHost, TytoSettingsTab } from '../settings-tab'
import { DEFAULT_SETTINGS, TytoSettings } from '../../../settings'
import { AllowListEditorInputs } from '../../allow-list-editor-inputs'
import { FakeCommandRegistry } from '../../../../test-support/fake-command-registry'
import { ObsidianCommandSearch } from '../../../../commands/obsidian-command-search'
import { AllowList } from '../../../../commands/allow-list'

const isGroup = (item: SettingDefinitionItem): item is SettingDefinitionGroup =>
  'type' in item && item.type === 'group'

const keyOf = (item: SettingDefinition): string | undefined =>
  'control' in item && item.control ? item.control.key : undefined

describe('TytoSettingsTab', () => {
  let host: SettingsHost
  let updates: Partial<TytoSettings>[]
  let tab: TytoSettingsTab

  const inputsOf = (settings: TytoSettings): AllowListEditorInputs => ({
    settings,
    search: new ObsidianCommandSearch(
      new FakeCommandRegistry().asRegistry(),
      new AllowList(settings.commandAllowList),
    ),
    resolvedCommands: [],
  })

  beforeEach(() => {
    updates = []
    host = {
      settings: { ...DEFAULT_SETTINGS, mistralApiKey: 'stored-key' },
      updateSettings: (update) => {
        updates.push(update)
        host.settings = { ...host.settings, ...update }
        return Promise.resolve()
      },
    }
    tab = new TytoSettingsTab(
      {} as App,
      host as unknown as ConstructorParameters<typeof TytoSettingsTab>[1],
      () => inputsOf(host.settings),
      host,
    )
  })

  describe('when the definitions are read', () => {
    it('puts the two general settings above the first group', () => {
      const definitions = tab.getSettingDefinitions()

      expect(definitions.slice(0, 2).map((item) => (item as SettingDefinition).name)).toEqual([
        'Mistral API key',
        'Edit model',
      ])
    })

    it('groups the rest under Skills, Commands and Vault, in that order', () => {
      const definitions = tab.getSettingDefinitions()

      expect(definitions.filter(isGroup).map((group) => group.heading)).toEqual([
        'Skills',
        'Commands',
        'Vault',
      ])
    })

    it('binds every declarative control to a settings key', () => {
      const definitions = tab.getSettingDefinitions()

      const keys = definitions.flatMap((item) =>
        isGroup(item) ? (item.items ?? []).map(keyOf) : [keyOf(item as SettingDefinition)],
      )

      expect(keys).toEqual([
        undefined,
        'editModel',
        'skillsPath',
        undefined,
        'searchEnabled',
        'openMode',
        'transcriptCopyEnabled',
      ])
    })

    // The two that carry no key are the two the design gives a render callback:
    // no control masks a value, and none expresses a live command search.
    it('renders the API key and the allow list itself', () => {
      const definitions = tab.getSettingDefinitions()

      const rendered = definitions.flatMap((item) =>
        isGroup(item)
          ? (item.items ?? []).filter((child) => 'render' in child && child.render)
          : 'render' in item && item.render
            ? [item]
            : [],
      )

      expect(rendered.map((item) => (item as SettingDefinition).name)).toEqual([
        'Mistral API key',
        'Allowed commands',
      ])
    })

    it('offers the daily note as a bare id, since the namespaced pattern matches nothing', () => {
      const commands = tab.getSettingDefinitions().filter(isGroup)[1]

      const desc = (commands.items?.[0] as SettingDefinition).desc

      expect(desc).toContain('daily-notes or open-or-create-file-command:*')
    })
  })

  describe('when a control value is read', () => {
    it('reads it off the settings the plugin holds', () => {
      expect(tab.getControlValue('editModel')).toBe(DEFAULT_SETTINGS.editModel)
    })
  })

  describe('when a control value is written', () => {
    it('saves through the plugin, so one writer owns the settings', async () => {
      await tab.setControlValue('searchEnabled', true)

      expect(updates).toEqual([{ searchEnabled: true }])
    })

    it('leaves the value readable at the key it was written under', async () => {
      await tab.setControlValue('editModel', 'mistral-large-latest')

      expect(tab.getControlValue('editModel')).toBe('mistral-large-latest')
    })
  })
})
