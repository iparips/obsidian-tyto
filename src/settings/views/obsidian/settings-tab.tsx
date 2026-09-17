import { App, PluginSettingTab, Setting, SettingDefinition, SettingDefinitionItem } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { AllowListEditor } from '../AllowListEditor'
import { AllowListEditorInputs } from '../allow-list-editor-inputs'
import { TytoSettings } from '../../settings'

export interface SettingsHost {
  settings: TytoSettings
  updateSettings: (update: Partial<TytoSettings>) => Promise<void>
}

// Called per render rather than once, so the inputs are rebuilt from the
// settings as they now stand.
export type BuildSettingsPanelFn = () => AllowListEditorInputs

export class TytoSettingsTab extends PluginSettingTab {
  private root: Root | null = null

  constructor(
    app: App,
    plugin: SettingsHost & ConstructorParameters<typeof PluginSettingTab>[1],
    private buildPanelFn: BuildSettingsPanelFn,
    private host: SettingsHost = plugin,
  ) {
    super(app, plugin)
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      this.apiKeyDefinition(),
      {
        name: 'Edit model',
        desc: 'The Mistral model that reads your instruction and edits the note.',
        control: { type: 'text', key: 'editModel' },
      },
      {
        type: 'group',
        heading: 'Skills',
        items: [
          {
            name: 'Skills folder',
            desc: 'Vault folder holding agent skills. Their names and descriptions are sent with each instruction. Leave empty to disable.',
            control: { type: 'folder', key: 'skillsPath' },
          },
        ],
      },
      { type: 'group', heading: 'Commands', items: [this.allowListDefinition()] },
      { type: 'group', heading: 'Vault', items: this.vaultDefinitions() },
    ]
  }

  // A render callback because no declarative control masks a value: the 1.13
  // text control offers a placeholder and nothing else, and the key must not
  // render in clear.
  private apiKeyDefinition(): SettingDefinition {
    return {
      name: 'Mistral API key',
      desc: 'Stored in this vault, and sent only to Mistral.',
      render: (setting: Setting) => {
        setting.addText((text) => {
          text.inputEl.type = 'password'
          text.setValue(this.host.settings.mistralApiKey)
          text.onChange((value) => void this.setControlValue('mistralApiKey', value))
        })
      },
    }
  }

  // A render callback because the allow list is a live search over the command
  // palette with a result list, which no control type expresses. The React root
  // is the tab's only remaining one, and Obsidian calls the returned function
  // before tearing the row down.
  private allowListDefinition(): SettingDefinition {
    return {
      name: 'Allowed commands',
      desc: 'Search for a command by the name shown in the command palette, or type an id or namespace pattern such as daily-notes or open-or-create-file-command:*. Tyto can run these and no others.',
      render: (setting: Setting) => this.mountAllowListEditor(setting),
    }
  }

  // Below the row rather than in its control cell: the editor is a search and
  // two lists, which the cell's width cannot hold. The class stacks the row.
  private mountAllowListEditor(setting: Setting): () => void {
    setting.setClass('tyto-allow-list-setting')
    this.root = createRoot(setting.settingEl.createDiv())
    this.renderAllowListEditor()
    return () => {
      this.root?.unmount()
      this.root = null
    }
  }

  private renderAllowListEditor(): void {
    const { settings, search, resolvedCommands } = this.buildPanelFn()
    this.root?.render(
      <AllowListEditor
        entries={settings.commandAllowList}
        search={search}
        resolved={resolvedCommands}
        onChange={(entries) => void this.saveAllowList(entries)}
      />,
    )
  }

  // The save is what the editor reads back, so the re-render waits for it.
  private async saveAllowList(entries: string[]): Promise<void> {
    await this.host.updateSettings({ commandAllowList: entries })
    this.renderAllowListEditor()
  }

  private vaultDefinitions(): SettingDefinition[] {
    return [
      {
        name: 'Search the vault to answer questions',
        desc: 'Tyto can search your notes and summarise what it finds in the panel. The summary is never written into a note.',
        control: { type: 'toggle', key: 'searchEnabled' },
      },
      {
        name: 'Ask before opening a note Tyto found',
        desc: 'Tyto can search for the note an instruction names and open it. Ask shows you what it found and waits for you to pick one. Open opens a note when only one matched, and still asks when several did. A note one of your commands opens never asks.',
        control: {
          type: 'dropdown',
          key: 'openMode',
          options: { confirm: 'Ask which note', auto: 'Open the only match' },
        },
      },
      {
        name: 'Copy the session transcript',
        desc: 'Adds a Copy button to the panel header. The transcript holds the whole session as Markdown, including your note text and any vault instructions, so a turn that went wrong can be filed rather than described. Your key is never in it.',
        control: { type: 'toggle', key: 'transcriptCopyEnabled' },
      },
    ]
  }

  getControlValue(key: string): unknown {
    return this.host.settings[key as keyof TytoSettings]
  }

  // Through updateSettings rather than mutating settings in place, so the
  // plugin stays the one writer and a session built earlier reads the change.
  async setControlValue(key: string, value: unknown): Promise<void> {
    await this.host.updateSettings({ [key]: value })
  }
}
