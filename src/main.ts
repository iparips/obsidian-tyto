import { Plugin, TFile } from 'obsidian'
import { SessionView, VIEW_TYPE_SESSION } from './session/views/obsidian/session-view'
import { registerTytoIcon, TYTO_ICON } from './session/views/obsidian/tyto-icon'
import { DEFAULT_SETTINGS, TytoSettings } from './settings/settings'
import { TytoSettingsTab } from './settings/views/obsidian/settings-tab'
import { PluginScope } from './wiring/plugin-scope'
import { SessionController } from './wiring/session-controller'
import { SessionLeaf } from './wiring/session-leaf'
import { SettingsPanelBuilder } from './wiring/settings-panel-builder'
import { SessionStore } from './session/session-store'

export default class TytoPlugin extends Plugin {
  settings: TytoSettings = DEFAULT_SETTINGS
  // Built once at load: the vault and the settings reader outlive every session,
  // and the settings are read through a function so the settings tab's edits
  // reach a session built before them.
  private pluginScope = new PluginScope(this.app, () => this.settings)
  // Built on first use rather than as a field: the store reads manifest.dir,
  // which a field initialiser runs too early to see.
  private controller: SessionController | null = null

  async onload(): Promise<void> {
    registerTytoIcon()
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) }
    this.registerView(
      VIEW_TYPE_SESSION,
      (leaf) => new SessionView(leaf, (view) => this.sessionController().storedPanelProps(view)),
    )
    this.addRibbonIcon(TYTO_ICON, 'Start Tyto session', () => this.openSession())
    this.addCommand({
      id: 'start-session',
      name: 'Start session',
      icon: TYTO_ICON,
      callback: () => this.openSession(),
    })
    this.addSettingTab(
      new TytoSettingsTab(this.app, this, () => this.settingsPanelBuilder().build()),
    )
  }

  async updateSettings(update: Partial<TytoSettings>): Promise<void> {
    this.settings = { ...this.settings, ...update }
    await this.saveData(this.settings)
  }

  private openSession(): void {
    void this.sessionController().openSession()
  }

  // One controller for the life of the plugin, so the engine following the user
  // is the one every later session replaces rather than a second listener.
  private sessionController(): SessionController {
    if (!this.controller) this.controller = this.buildSessionController()
    return this.controller
  }

  private buildSessionController(): SessionController {
    return new SessionController(
      this.pluginScope,
      new SessionLeaf(this.app),
      new SessionStore(this.app.vault.adapter, this.manifest.dir),
      {
        onFileOpen: (listenerFn) => this.onFileOpen(listenerFn),
        onObsidianBackgrounded: (listenerFn) => this.onObsidianBackgrounded(listenerFn),
      },
      this.manifest.version,
    )
  }

  private settingsPanelBuilder(): SettingsPanelBuilder {
    return new SettingsPanelBuilder(this.app, () => this.settings)
  }

  private onFileOpen(listenerFn: (file: TFile | null) => void): void {
    this.registerEvent(this.app.workspace.on('file-open', listenerFn))
  }

  // Obsidian is one page, so document.hidden is the whole window going away:
  // another app, a minimise, or a locked phone. Closing the panel does not fire
  // it, and the view's own unmount covers that.
  private onObsidianBackgrounded(listenerFn: () => void): () => void {
    const handlerFn = () => document.hidden && listenerFn()
    this.registerDomEvent(document, 'visibilitychange', handlerFn)
    return () => document.removeEventListener('visibilitychange', handlerFn)
  }
}
