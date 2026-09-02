import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { Recorder } from './capture/recorder'
import { EditEngine } from './engine/edit-engine'
import { MistralProvider } from './providers/mistral-provider'
import { AgentSession } from './engine/models/agent-session'
import { WorkspaceNoteLocator } from './engine/workspace-note-locator'
import { RebindModal } from './session/views/rebind-modal'
import { SessionView, VIEW_TYPE_SESSION } from './session/views/session-view'
import { SessionPanelProps } from './session/views/SessionPanel'
import { DEFAULT_SETTINGS, VoiceEditSettings } from './settings/settings'
import { VoiceEditSettingsTab } from './settings/settings-tab'
import { SkillRepository } from './skills/skill-repository'

export default class VoiceEditPlugin extends Plugin {
  settings: VoiceEditSettings = DEFAULT_SETTINGS

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) }
    this.registerView(VIEW_TYPE_SESSION, (leaf) => new SessionView(leaf))
    this.addRibbonIcon('mic', 'Start voice edit session', () => this.openSession())
    this.addCommand({
      id: 'start-session',
      name: 'Start session for active note',
      icon: 'mic',
      callback: () => this.openSession(),
    })
    this.addSettingTab(new VoiceEditSettingsTab(this.app, this))
  }

  async updateSettings(update: Partial<VoiceEditSettings>): Promise<void> {
    this.settings = { ...this.settings, ...update }
    await this.saveData(this.settings)
  }

  private async openSession(): Promise<void> {
    const file = this.app.workspace.getActiveFile()
    if (!file) return void new Notice('Open a note first.')
    const view = await this.revealSessionView()
    if (!view) return
    await this.bindOrAskRebind(view, file)
  }

  private async bindOrAskRebind(view: SessionView, file: TFile): Promise<void> {
    const boundName = view.boundNoteName()
    if (boundName && boundName !== file.basename)
      return new RebindModal(this.app, boundName, file.basename, async () =>
        view.bindSession(await this.buildPanelProps(file)),
      ).open()
    if (!boundName) view.bindSession(await this.buildPanelProps(file))
  }

  private async buildPanelProps(file: TFile): Promise<SessionPanelProps> {
    const modelProvider = new MistralProvider(this.settings.mistralApiKey, this.settings.editModel)
    const session = new AgentSession(file)
    const noteLocator = new WorkspaceNoteLocator(this.app, file)
    const engine = new EditEngine(modelProvider, session, this.skillRepository(), noteLocator)
    return {
      noteName: file.basename,
      recorder: new Recorder(),
      transcribe: (blob, mimeType) => modelProvider.transcribe(blob, mimeType),
      processUtterance: (text) => engine.processUtterance(text),
      onHidden: (listener) => this.onDocumentHidden(listener),
      notify: (message) => void new Notice(message),
    }
  }

  private onDocumentHidden(listener: () => void): () => void {
    const handler = () => document.hidden && listener()
    this.registerDomEvent(document, 'visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }

  private skillRepository(): SkillRepository {
    return new SkillRepository(this.app.vault.adapter, this.settings.skillsPath)
  }

  private async revealSessionView(): Promise<SessionView | null> {
    const leaf = this.sessionLeaf()
    if (!leaf) return null
    await this.app.workspace.revealLeaf(leaf)
    return leaf.view instanceof SessionView ? leaf.view : null
  }

  private sessionLeaf(): WorkspaceLeaf | null {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_SESSION)[0]
    if (existing) return existing
    const leaf = this.app.workspace.getRightLeaf(false)
    leaf?.setViewState({ type: VIEW_TYPE_SESSION, active: true })
    return leaf
  }
}
