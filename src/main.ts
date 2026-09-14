import { Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { RebindModal } from './session/views/obsidian/rebind-modal'
import { SessionView, VIEW_TYPE_SESSION } from './session/views/obsidian/session-view'
import { SessionPanelProps } from './session/views/SessionPanel'
import { registerTytoIcon, TYTO_ICON } from './session/views/obsidian/tyto-icon'
import { DEFAULT_SETTINGS, TytoSettings } from './settings/settings'
import { TytoSettingsTab } from './settings/settings-tab'
import { EditEngine } from './engine/edit-engine'
import { EngineFactory } from './wiring/engine-factory'
import { PluginScope } from './wiring/plugin-scope'
import { PanelPresence, SessionBuilder } from './wiring/session-builder'
import { SessionStore } from './session/session-store'
import { SessionSnapshot } from './session/models/session-snapshot'

export default class TytoPlugin extends Plugin {
  settings: TytoSettings = DEFAULT_SETTINGS
  private activeEngine: EditEngine | null = null
  // Built once at load: the vault and the settings reader outlive every session,
  // and the settings are read through a function so the settings tab's edits
  // reach a session built before them.
  private pluginScope = new PluginScope(this.app, () => this.settings)
  private followsActiveNote = false

  async onload(): Promise<void> {
    registerTytoIcon()
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) }
    this.registerView(
      VIEW_TYPE_SESSION,
      (leaf) => new SessionView(leaf, (view) => this.storedPanelProps(view)),
    )
    this.addRibbonIcon(TYTO_ICON, 'Start Tyto session', () => this.openSession())
    this.addCommand({
      id: 'start-session',
      name: 'Start session',
      icon: TYTO_ICON,
      callback: () => this.openSession(),
    })
    this.addSettingTab(new TytoSettingsTab(this.app, this))
  }

  async updateSettings(update: Partial<TytoSettings>): Promise<void> {
    this.settings = { ...this.settings, ...update }
    await this.saveData(this.settings)
  }

  // A session starts whether or not a note is open: unbound, it searches and
  // answers, and binds to the first note the user opens.
  private async openSession(): Promise<void> {
    const file = this.activeNote()
    const view = await this.revealSessionView()
    if (!view) return
    // The view restores itself as it opens, so a session left behind is
    // usually already here. This read covers the case where the leaf existed
    // before the plugin could restore into it.
    if (!view.hasSession()) {
      const stored = await this.storedPanelProps(view)
      if (stored) return view.bindSession(stored)
    }
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

  private restoredPanelProps(stored: SessionSnapshot, view: SessionView): SessionPanelProps {
    return this.sessionBuilder().restore(stored, this.panelPresence(view))
  }

  // Asked by the view as it opens, which is where a leaf Obsidian reopened on
  // restart gets its session back without the user invoking Tyto again.
  private async storedPanelProps(view: SessionView): Promise<SessionPanelProps | null> {
    const stored = await this.sessionStore().read()
    return stored ? this.restoredPanelProps(stored, view) : null
  }

  private sessionStore(): SessionStore {
    return new SessionStore(this.app.vault.adapter, this.manifest.dir)
  }

  private sessionBuilder(): SessionBuilder {
    return new SessionBuilder(
      this.settings,
      this.engineFactory(),
      (engine) => this.followActiveNoteWith(engine),
      this.sessionStore(),
      this.manifest.version,
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
  // Not awaited: a workspace event handler has no one to return to, and the
  // retarget is what the next tool call reads rather than this caller.
  private retargetActiveEngine(file: TFile | null): void {
    if (file?.extension === 'md') void this.activeEngine?.followActiveNote(file.path)
  }

  // Rebuilds the props, so the model's history and the panel's entries both go.
  // The note is read now rather than taken from the session being replaced: a
  // reset is what the user reaches for when the binding is wrong, and handing
  // the new session the same note is what left a stranded one stranded.
  // The stored session goes with the live one, so the session the user replaced
  // does not come back on the next load (FR8).
  private startNewSession(view: SessionView): void {
    void this.sessionStore().discard()
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
    return new EngineFactory(this.pluginScope)
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
