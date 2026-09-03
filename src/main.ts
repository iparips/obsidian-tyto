import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { Recorder } from './capture/recorder'
import { MistralProvider } from './providers/mistral-provider'
import { RebindModal } from './session/views/rebind-modal'
import { SessionView, VIEW_TYPE_SESSION } from './session/views/session-view'
import { SessionPanelProps } from './session/views/SessionPanel'
import { DEFAULT_SETTINGS, OwlSettings } from './settings/settings'
import { OwlSettingsTab } from './settings/settings-tab'
import { SkillRepository } from './skills/skill-repository'
import { AgentsMdChain } from './agents/agents-md-chain'
import { AgentsMdRepository } from './agents/agents-md-repository'
import { InstructionReport } from './agents/instruction-report'
import { InstructionListeners } from './session/instruction-listeners'
import { TurnProgressPublisher } from './engine/turn-progress-publisher'
import { EditEngine } from './engine/edit-engine'
import { EngineFactory } from './engine/engine-factory'
import { SessionListeners } from './session/session-listeners'

export default class OwlPlugin extends Plugin {
  settings: OwlSettings = DEFAULT_SETTINGS
  private activeEngine: EditEngine | null = null
  private followsActiveNote = false

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) }
    this.registerView(VIEW_TYPE_SESSION, (leaf) => new SessionView(leaf))
    this.addRibbonIcon('mic', 'Start Owl session', () => this.openSession())
    this.addCommand({
      id: 'start-session',
      name: 'Start session for active note',
      icon: 'mic',
      callback: () => this.openSession(),
    })
    this.addSettingTab(new OwlSettingsTab(this.app, this))
  }

  async updateSettings(update: Partial<OwlSettings>): Promise<void> {
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
    const listeners = new InstructionListeners()
    const sessionListeners = new SessionListeners()
    const engine = this.engineFactory().build(
      modelProvider,
      file,
      this.buildTurnProgressPublisher(sessionListeners, listeners),
    )
    this.followActiveNoteWith(engine)
    return {
      noteName: file.basename,
      recorder: new Recorder(),
      transcribe: (blob, mimeType) => modelProvider.transcribe(blob, mimeType),
      processUtterance: (text) => engine.processUtterance(text),
      onHidden: (listener) => this.onDocumentHidden(listener),
      notify: (message) => void new Notice(message),
      startNewSession: () => void this.startNewSession(file, view),
      onInstructions: (listener) => listeners.subscribe(listener),
      onCommandRun: (listener) => sessionListeners.commandRuns.subscribe(listener),
      onAnswer: (listener) => sessionListeners.answers.subscribe(listener),
      onTargetNoteChanged: (listener) => sessionListeners.retargets.subscribe(listener),
    }
  }

  // Only the newest engine follows the user: an earlier session's engine keeps
  // the note it was bound to rather than trailing every note opened since.
  private followActiveNoteWith(engine: EditEngine): void {
    this.activeEngine = engine
    if (this.followsActiveNote) return
    this.followsActiveNote = true
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => this.retargetActiveEngine(file)),
    )
  }

  private retargetActiveEngine(file: TFile | null): void {
    if (file) this.activeEngine?.followActiveNote(file.path)
  }

  // Each channel lands somewhere different: two become panel entries, one names
  // the target note in the header (FR19), and the chain also reaches a Notice
  // and the console.
  private buildTurnProgressPublisher(
    sessionListeners: SessionListeners,
    instructions: InstructionListeners,
  ): TurnProgressPublisher {
    // A command that retargets resolves the chain again, so the last report is
    // held to keep an unchanged chain from printing twice.
    let lastReported: InstructionReport | null = null
    return new TurnProgressPublisher(
      (text) => sessionListeners.commandRuns.publish(text),
      (text, sources) => sessionListeners.answers.publish({ text, sources }),
      (path) => sessionListeners.retargets.publish(path),
      (chain) => {
        lastReported = this.reportInstructions(chain, instructions, lastReported)
      },
      (name) => sessionListeners.commandRuns.publish(`Skill applied: ${name}`),
    )
  }

  // The three channels a drop reaches the user through: the panel entry, one
  // Notice per resolved chain, and a console line naming every file (FR10, FR14-16).
  // Returns what was reported, so an identical chain is not reported again.
  private reportInstructions(
    chain: AgentsMdChain,
    listeners: InstructionListeners,
    lastReported: InstructionReport | null,
  ): InstructionReport | null {
    const report = InstructionReport.of(chain)
    if (report.isEmpty() || report.sameAs(lastReported)) return lastReported
    listeners.publish(report.panelText())
    if (!chain.hasDrops()) return report
    new Notice(report.noticeText())
    OwlPlugin.logDrops(chain)
    return report
  }

  private static logDrops(chain: AgentsMdChain): void {
    chain.dropped.forEach((file) =>
      console.debug('[owl] instruction file dropped:', file.fileName, 'in', file.label()),
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

  private engineFactory(): EngineFactory {
    return new EngineFactory(
      this.app,
      this.settings,
      this.skillRepository(),
      this.agentsMdRepository(),
    )
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
