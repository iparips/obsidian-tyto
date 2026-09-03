import { Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { RebindModal } from './session/views/rebind-modal'
import { SessionView, VIEW_TYPE_SESSION } from './session/views/session-view'
import { SessionPanelProps } from './session/views/SessionPanel'
import { DEFAULT_SETTINGS, OwlSettings } from './settings/settings'
import { OwlSettingsTab } from './settings/settings-tab'
import { SkillRepository } from './skills/skill-repository'
import { AgentsMdRepository } from './agents/agents-md-repository'
import { EditEngine } from './engine/edit-engine'
import { EngineFactory } from './engine/engine-factory'
import { PanelPresence, SessionBuilder } from './session/session-builder'

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
      name: 'Start session',
      icon: 'mic',
      callback: () => this.openSession(),
    })
    this.addSettingTab(new OwlSettingsTab(this.app, this))
  }

  async updateSettings(update: Partial<OwlSettings>): Promise<void> {
    this.settings = { ...this.settings, ...update }
    await this.saveData(this.settings)
  }

  // A session starts whether or not a note is open: unbound, it searches and
  // answers, and binds to the first note the user opens.
  private async openSession(): Promise<void> {
    const file = this.activeNote()
    const view = await this.revealSessionView()
    if (!view) return
    this.bindOrAskRebind(view, file)
  }

  // The rebind prompt asks only when a bound session would move to another
  // note; an unbound session has nothing to move away from.
  private bindOrAskRebind(view: SessionView, file: TFile | null): void {
    const boundName = view.boundNoteName()
    if (boundName && file && boundName !== file.basename)
      return new RebindModal(this.app, boundName, file.basename, () =>
        view.bindSession(this.buildPanelProps(file, view)),
      ).open()
    if (!view.hasSession()) view.bindSession(this.buildPanelProps(file, view))
  }

  private buildPanelProps(file: TFile | null, view: SessionView): SessionPanelProps {
    return this.sessionBuilder().build(file, this.panelPresence(view))
  }

  private sessionBuilder(): SessionBuilder {
    return new SessionBuilder(this.settings, this.engineFactory(), (engine) =>
      this.followActiveNoteWith(engine),
    )
  }

  // What only the plugin can answer: whether the leaf is showing, and how to
  // reveal it when the user acts on a notice (FR24, FR27).
  private panelPresence(view: SessionView): PanelPresence {
    return {
      isVisible: () => this.sessionLeafIsVisible(),
      reveal: () => void this.revealSessionView(),
      onHidden: (listener) => this.onDocumentHidden(listener),
      startNewSession: () => this.startNewSession(view),
    }
  }

  // isShown is false when the drawer is closed and when another tab of the
  // sidebar is in front of it.
  private sessionLeafIsVisible(): boolean {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_SESSION)[0]
    return leaf?.view.containerEl.isShown() ?? false
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

  // Markdown only. Obsidian opens canvases, PDFs and Bases files through the
  // same event, and binding the session to one strands every later turn: the
  // edit tools need an editor, and only a markdown view has one.
  private retargetActiveEngine(file: TFile | null): void {
    if (file?.extension === 'md') this.activeEngine?.followActiveNote(file.path)
  }

  // Rebuilds the props, so the model's history and the panel's entries both go.
  // The note is read now rather than taken from the session being replaced: a
  // reset is what the user reaches for when the binding is wrong, and handing
  // the new session the same note is what left a stranded one stranded.
  private startNewSession(view: SessionView): void {
    view.bindSession(this.buildPanelProps(this.activeNote(), view))
  }

  // Null for anything but a note, so a reset while a canvas or a Bases file is
  // in front leaves the session unbound rather than bound to something no
  // editor can show. An unbound session searches and answers, and binds to the
  // first note the user opens.
  private activeNote(): TFile | null {
    const file = this.app.workspace.getActiveFile()
    return file?.extension === 'md' ? file : null
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
