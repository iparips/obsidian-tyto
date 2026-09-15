import { ItemView, WorkspaceLeaf } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SessionPanel, SessionPanelProps } from '../SessionPanel'
import { TYTO_ICON } from './tyto-icon'

export const VIEW_TYPE_SESSION = 'tyto-session'

// What the view cannot answer for itself: whether a session was left behind,
// and what its props are. Only the plugin reaches the store. It takes the view
// back because a session's props hold a PanelPresence, which is built around
// the leaf this view owns.
export type RestoreSession = (view: SessionView) => Promise<SessionPanelProps | null>

export class SessionView extends ItemView {
  private root: Root | null = null
  private panelProps: SessionPanelProps | null = null
  // Bumped on every bind, and the panel's whole key, so an unbound session needs
  // no note name to remount and clear the entries on screen.
  private sessionCount = 0

  constructor(
    leaf: WorkspaceLeaf,
    // Absent for a view built before the plugin can restore, which renders
    // empty as it did before.
    private restoreSession?: RestoreSession,
  ) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_SESSION
  }

  getDisplayText(): string {
    return 'Tyto session'
  }

  getIcon(): string {
    return TYTO_ICON
  }

  bindSession(props: SessionPanelProps): void {
    this.panelProps = props
    this.sessionCount += 1
    this.renderPanel()
  }

  // Read by the suite rather than by the plugin, which stopped comparing note
  // names once the binding started coming from the workspace. It is how a test
  // tells one bound session from another.
  boundNoteName(): string | null {
    return this.panelProps?.noteName ?? null
  }

  hasSession(): boolean {
    return this.panelProps !== null
  }

  // Obsidian reopens the leaf itself on restart, so a session left behind must
  // come back here rather than waiting for the user to invoke Tyto again. A
  // sidebar that reads empty until you know to re-open it is the failure FR4
  // names.
  async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl)
    this.renderPanel()
    if (this.panelProps) return
    const restored = await this.restoreSession?.(this)
    // Checked again: the user may have started a session while the read was in
    // flight, and a restore must not replace one they are already using.
    if (restored && !this.panelProps) this.bindSession(restored)
  }

  async onClose(): Promise<void> {
    this.root?.unmount()
    this.root = null
    this.panelProps = null
  }

  private renderPanel(): void {
    if (!this.root) return
    if (!this.panelProps) return
    const key = `session-${this.sessionCount}`
    this.root.render(<SessionPanel key={key} {...this.panelProps} />)
  }
}
