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
    it('groups the settings under Model, Skills, Commands and Vault, in that order', () => {
      const definitions = tab.getSettingDefinitions()

      expect(definitions.filter(isGroup).map((group) => group.heading)).toEqual([
        'Model',
        'Skills',
        'Commands',
        'Vault',
      ])
    })

    // The budget sits with the model settings because what it caps is spend:
    // a turn step is a model call, so the number is what an instruction costs.
    it('puts the turn step budget under Model', () => {
      const model = tab.getSettingDefinitions().filter(isGroup)[0]

      expect((model.items ?? []).map((item) => (item as SettingDefinition).name)).toEqual([
        'Mistral API key',
        'Edit model',
        'Turn step budget',
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
        'maxTurnSteps',
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
      const commands = tab.getSettingDefinitions().filter(isGroup)[2]

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

  // A budget counts turn steps, so anything that is not a whole count leaves
  // the stored number standing rather than replacing it with one the loop
  // cannot spend.
  describe('when the turn step budget is written', () => {
    it('saves a whole number', async () => {
      await tab.setControlValue('maxTurnSteps', 30)

      expect(updates).toEqual([{ maxTurnSteps: 30 }])
    })

    it('rejects a fraction, which is not a number of steps', async () => {
      await tab.setControlValue('maxTurnSteps', 12.5)

      expect(updates).toEqual([])
    })

    it('rejects a value below one, which would end every turn unstarted', async () => {
      await tab.setControlValue('maxTurnSteps', 0)

      expect(updates).toEqual([])
    })

    it('rejects a value that is not a number at all', async () => {
      await tab.setControlValue('maxTurnSteps', '20')

      expect(updates).toEqual([])
    })
  })
})
