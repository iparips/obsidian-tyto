import { App, PluginSettingTab } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SettingsPanel } from './SettingsPanel'
import { OwlSettings } from './settings'
import { AllowList } from '../commands/allow-list'
import { CommandRegistry } from '../commands/command-registry'
import { CommandCatalogue } from '../commands/command-catalogue'
import { CommandSearch } from '../commands/command-search'

export interface SettingsHost {
  settings: OwlSettings
  updateSettings(update: Partial<OwlSettings>): Promise<void>
}

export class OwlSettingsTab extends PluginSettingTab {
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
    const registry = new CommandRegistry(this.app)
    const allowList = new AllowList(this.host.settings.commandAllowList)
    this.root?.render(
      <SettingsPanel
        settings={this.host.settings}
        onChange={(update) => this.applyUpdate(update)}
        search={new CommandSearch(registry, allowList)}
        resolvedCommands={new CommandCatalogue(registry, allowList).resolve()}
      />,
    )
  }

  private async applyUpdate(update: Partial<OwlSettings>): Promise<void> {
    await this.host.updateSettings(update)
    this.renderPanel()
  }
}
