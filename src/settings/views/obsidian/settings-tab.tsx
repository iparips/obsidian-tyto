import { App, PluginSettingTab } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SettingsPanel, SettingsPanelProps } from '../SettingsPanel'
import { TytoSettings } from '../../settings'

export interface SettingsHost {
  settings: TytoSettings
  updateSettings(update: Partial<TytoSettings>): Promise<void>
}

// What the tab cannot answer for itself: what the panel's collaborators are.
// Only wiring knows how a search, a catalogue and an allow-list fit together.
// Called per render rather than once, so the props are rebuilt from the
// settings as they now stand. Saving an edit is the tab's, so onChange is not
// among them.
export type BuildSettingsPanelFn = () => Omit<SettingsPanelProps, 'onChange'>

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

  display(): void {
    this.root = createRoot(this.containerEl)
    this.renderPanel()
  }

  hide(): void {
    this.root?.unmount()
    this.root = null
  }

  private renderPanel(): void {
    this.root?.render(
      <SettingsPanel {...this.buildPanelFn()} onChange={(update) => this.applyUpdate(update)} />,
    )
  }

  // The save is what the panel reads back, so the re-render waits for it. The
  // tab owns this rather than wiring: only it holds the root to render into.
  private async applyUpdate(update: Partial<TytoSettings>): Promise<void> {
    await this.host.updateSettings(update)
    this.renderPanel()
  }
}
