import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { Recorder } from './capture/recorder'
import { EditEngine } from './engine/edit-engine'
import { NoteEditor } from './engine/note-editor'
import { MistralProvider } from './providers/mistral-provider'
import { AgentSession } from './engine/models/agent-session'
import { WorkspaceNoteLocator } from './engine/workspace-note-locator'
import { RebindModal } from './session/views/rebind-modal'
import { SessionView, VIEW_TYPE_SESSION } from './session/views/session-view'
import { SessionPanelProps } from './session/views/SessionPanel'
import { DEFAULT_SETTINGS, VoiceEditSettings } from './settings/settings'
import { VoiceEditSettingsTab } from './settings/settings-tab'
import { SkillRepository } from './skills/skill-repository'
import { AgentsMdChain } from './agents/agents-md-chain'
import { AgentsMdRepository } from './agents/agents-md-repository'
import { InstructionReport } from './agents/instruction-report'
import { InstructionListeners } from './session/instruction-listeners'

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
        view.bindSession(await this.buildPanelProps(file, view)),
      ).open()
    if (!boundName) view.bindSession(await this.buildPanelProps(file, view))
  }

  private async buildPanelProps(file: TFile, view: SessionView): Promise<SessionPanelProps> {
    const modelProvider = new MistralProvider(this.settings.mistralApiKey, this.settings.editModel)
    const session = new AgentSession(file)
    const noteLocator = new WorkspaceNoteLocator(this.app, file)
    const listeners = new InstructionListeners()
    const engine = new EditEngine(
      modelProvider,
      session,
      this.skillRepository(),
      noteLocator,
      this.agentsMdRepository(),
      new NoteEditor(),
      (chain) => this.reportInstructions(chain, listeners),
    )
    return {
      noteName: file.basename,
      recorder: new Recorder(),
      transcribe: (blob, mimeType) => modelProvider.transcribe(blob, mimeType),
      processUtterance: (text) => engine.processUtterance(text),
      onHidden: (listener) => this.onDocumentHidden(listener),
      notify: (message) => void new Notice(message),
      startNewSession: () => void this.startNewSession(file, view),
      onInstructions: (listener) => listeners.subscribe(listener),
    }
  }

  // The three channels a drop reaches the user through: the panel entry, one
  // Notice per resolved chain, and a console line naming every file (FR10, FR14-16).
  private reportInstructions(chain: AgentsMdChain, listeners: InstructionListeners): void {
    const report = InstructionReport.of(chain)
    if (report.isEmpty()) return
    listeners.publish(report.panelText())
    if (!chain.hasDrops()) return
    new Notice(report.noticeText())
    VoiceEditPlugin.logDrops(chain)
  }

  private static logDrops(chain: AgentsMdChain): void {
    chain.dropped.forEach((file) =>
      console.debug('[voice-edit] instruction file dropped:', file.fileName, 'in', file.label()),
    )
  }

  // Rebuilds the props, so the model's history and the panel's entries both go.
  private async startNewSession(file: TFile, view: SessionView): Promise<void> {
    view.bindSession(await this.buildPanelProps(file, view))
  }

  private onDocumentHidden(listener: () => void): () => void {
    const handler = () => document.hidden && listener()
    this.registerDomEvent(document, 'visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }

  private skillRepository(): SkillRepository {
    return new SkillRepository(this.app.vault.adapter, this.settings.skillsPath)
  }

  private agentsMdRepository(): AgentsMdRepository {
    return new AgentsMdRepository(this.app.vault.adapter)
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
