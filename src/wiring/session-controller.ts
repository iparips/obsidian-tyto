import { TFile } from 'obsidian'
import { EditEngine } from '../engine/edit-engine'
import { SessionSnapshot } from '../session/models/session-snapshot'
import { SessionStore } from '../session/session-store'
import { SessionPanelProps } from '../session/views/SessionPanel'
import { SessionView } from '../session/views/obsidian/session-view'
import { EngineFactory } from './engine-factory'
import { PluginScope } from './plugin-scope'
import { PanelPresence, SessionBuilder } from './session-builder'
import { SessionLeaf } from './session-leaf'

// Owns a session once the leaf exists: assembling its panel props, restoring
// the one left behind, and keeping the newest engine pointed at the note the
// user is on.
export class SessionController {
  private activeEngine: EditEngine | null = null
  private followsActiveNote = false

  constructor(
    private scope: PluginScope,
    private leaf: SessionLeaf,
    private store: SessionStore,
    // The two registrations only the plugin can make, since both register
    // against its lifetime and are unregistered when it unloads. The file is
    // every file, not only notes: Obsidian announces canvases, PDFs and Bases
    // files through the same event, and null once nothing is open.
    private onObsidianFileOpenedFn: (listenerFn: (file: TFile | null) => void) => void,
    private onObsidianBackgroundedFn: (listenerFn: () => void) => () => void,
    // From the manifest, so a transcript read months later says which build of
    // the plugin produced it.
    private pluginVersion: string,
  ) {}

  // A session starts whether or not a note is open: unbound, it searches and
  // answers, and binds to the first note the user opens. A session already
  // running is left alone, since it binds to the open note as it is assembled
  // and follows the user from there.
  async openSession(): Promise<void> {
    const view = await this.leaf.reveal()
    if (!view) return
    // The view restores itself as it opens, and revealing one is what starts
    // that. Deciding the panel is empty before the read settles is what bound a
    // fresh session over the one left behind.
    await view.whenOpened()
    if (!view.hasSession()) view.bindSession(this.buildPanelProps(view))
  }

  // Asked by the view as it opens, which is where a leaf Obsidian reopened on
  // restart gets its session back without the user invoking Tyto again.
  async storedPanelProps(view: SessionView): Promise<SessionPanelProps | null> {
    const stored = await this.store.read()
    return stored ? this.restoredPanelProps(stored, view) : null
  }

  private buildPanelProps(view: SessionView): SessionPanelProps {
    return this.sessionBuilder().build(this.panelPresence(view))
  }

  private restoredPanelProps(stored: SessionSnapshot, view: SessionView): SessionPanelProps {
    return this.sessionBuilder().restore(stored, this.panelPresence(view))
  }

  private sessionBuilder(): SessionBuilder {
    return new SessionBuilder(
      this.scope.settings,
      new EngineFactory(this.scope),
      (engine) => this.followActiveNoteWith(engine),
      this.scope.activeNote(),
      this.store,
      this.pluginVersion,
    )
  }

  // What only the plugin can answer: whether the leaf is showing, and how to
  // reveal it when the user acts on a notice (FR24, FR27).
  private panelPresence(view: SessionView): PanelPresence {
    return {
      isVisible: () => this.leaf.isVisible(),
      reveal: () => void this.leaf.reveal(),
      onObsidianBackgrounded: (listenerFn) => this.onObsidianBackgroundedFn(listenerFn),
      startNewSession: () => this.startNewSession(view),
    }
  }

  // Rebuilds the props, so the model's history and the panel's entries both go.
  // The note is read now rather than taken from the session being replaced: a
  // reset is what the user reaches for when the binding is wrong, and handing
  // the new session the same note is what left a stranded one stranded.
  // The stored session goes with the live one, so the session the user replaced
  // does not come back on the next load (FR8).
  private startNewSession(view: SessionView): void {
    void this.store.discard()
    view.bindSession(this.buildPanelProps(view))
  }

  // Only the newest engine follows the user: an earlier session's engine keeps
  // the note it was bound to rather than trailing every note opened since.
  private followActiveNoteWith(engine: EditEngine): void {
    this.activeEngine = engine
    if (this.followsActiveNote) return
    this.followsActiveNote = true
    this.onObsidianFileOpenedFn((file) => this.retargetActiveEngine(file))
  }

  // Markdown only. Obsidian opens canvases, PDFs and Bases files through the
  // same event, and binding the session to one strands every later turn: the
  // edit tools need an editor, and only a markdown view has one.
  // Not awaited: a workspace event handler has no one to return to, and the
  // retarget is what the next tool call reads rather than this caller.
  private retargetActiveEngine(file: TFile | null): void {
    if (file?.extension === 'md') void this.activeEngine?.followActiveNote(file.path)
  }
}
