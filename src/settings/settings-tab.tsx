import { App, PluginSettingTab } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SettingsPanel } from './SettingsPanel'
import { TytoSettings } from './settings'
import { AllowList } from '../commands/allow-list'
import { ObsidianCommandRegistry } from '../commands/obsidian-command-registry'
import { ObsidianCommandCatalogue } from '../commands/obsidian-command-catalogue'
import { ObsidianCommandSearch } from '../commands/obsidian-command-search'

export interface SettingsHost {
  settings: TytoSettings
  updateSettings(update: Partial<TytoSettings>): Promise<void>
}

export class TytoSettingsTab extends PluginSettingTab {
  private root: Root | null = null

  constructor(
    app: App,
    plugin: SettingsHost & ConstructorParameters<typeof PluginSettingTab>[1],
    private host: SettingsHost = plugin,
  ) {
    super(app, plugin)
  }

  display(): void {
    this.root = createRoot(this.containerEl)
    this.renderPanel()
  }

  hide(): void {
    this.root?.unmount()
    this.root = null
  }

  private renderPanel(): void {
    const registry = new ObsidianCommandRegistry(this.app)
    const allowList = new AllowList(this.host.settings.commandAllowList)
    this.root?.render(
      <SettingsPanel
        settings={this.host.settings}
        onChange={(update) => this.applyUpdate(update)}
        search={new ObsidianCommandSearch(registry, allowList)}
        resolvedCommands={new ObsidianCommandCatalogue(registry, allowList).resolve()}
      />,
    )
  }

  private async applyUpdate(update: Partial<TytoSettings>): Promise<void> {
    await this.host.updateSettings(update)
    this.renderPanel()
  }
}
